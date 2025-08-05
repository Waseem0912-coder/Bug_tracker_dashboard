from models import db, ChatSession, ChatMessage, Report, ReportVersion, File, ModelSelection
import file_processor
import chart_generator
import ollama_service
import template_engine


def handle_chat(payload):
    # Session and message
    session = ChatSession()
    db.session.add(session)
    db.session.commit()

    # Save user message
    message = payload.get('message', '')
    chat_msg = ChatMessage(session_id=session.id, message_text=message, message_type='user')
    db.session.add(chat_msg)

    # Save model selections
    models = payload.get('models', {})
    sel = ModelSelection(
        session_id=session.id,
        text_model=models.get('text_model'),
        embedding_model=models.get('embedding_model'),
        vision_model=models.get('vision_model')
    )
    db.session.add(sel)
    db.session.commit()

    # Process files
    files = payload.get('files', [])
    processed = file_processor.process_files(files)
    for filename, info in processed.items():
        file_record = File(
            session_id=session.id,
            filename=filename,
            file_type=info['type'],
            processed_data=info['data'],
            content_summary=str(info['data'])
        )
        db.session.add(file_record)
    db.session.commit()

    template_id = payload.get('template_id')
    edit_request = payload.get('edit_request')
    report_id = payload.get('report_id')

    # Editing existing report
    if edit_request and report_id:
        report = Report.query.get(report_id)
        new_content = ollama_service.generate_edit(report.content_html, edit_request, model=models.get('text_model'))
        # Save version
        rv = ReportVersion(
            report_id=report.id,
            content_html=new_content,
            edit_request=edit_request,
            version_number=report.version + 1
        )
        report.content_html = new_content
        report.version += 1
        db.session.add(rv)
        db.session.commit()
        reply = f"Report updated to version {report.version}."
        return {
            'reply': reply,
            'report_html': new_content,
            'report_id': report.id
        }

    # Create new report
    # Combine text and file content
    content_parts = [message]
    for info in processed.values():
        if info['type'] in ['text', 'pdf']:
            content_parts.append(info['data'])
        elif info['type'] == 'ppt':
            content_parts.append(' '.join(info['data']))
    combined_content = '\n'.join(content_parts)

    # Generate charts
    charts = chart_generator.generate_charts(processed)

    # Generate report text
    if template_id:
        template = template_engine.select_template(template_id)
        context = {'content': combined_content}
        report_body = template_engine.render_template_report(template, context)
    else:
        prompt = f"{combined_content}\n\nGenerate a report based on the above content."  # simple prompt
        report_body = ollama_service.generate_text(prompt, model=models.get('text_model'))

    # Build HTML
    report_html = f"<div>{report_body}</div>"
    for fname, ch_html in charts.items():
        report_html += ch_html

    # Save report and version
    report = Report(
        session_id=session.id,
        title=message[:50],
        content_html=report_html,
        version=1
    )
    db.session.add(report)
    db.session.commit()
    rv = ReportVersion(
        report_id=report.id,
        content_html=report_html,
        edit_request=None,
        version_number=1
    )
    db.session.add(rv)
    db.session.commit()

    reply = "Here is your report."
    return {
        'reply': reply,
        'report_html': report_html,
        'report_id': report.id
    }
