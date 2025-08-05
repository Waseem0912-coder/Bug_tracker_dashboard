import plotly.express as px


def generate_charts(processed_files):
    """
    Generate charts for processed files. Returns dict mapping filename to chart HTML.
    """
    charts = {}
    for fname, info in processed_files.items():
        if info['type'] == 'excel':
            df = info['data']
            # Choose numeric columns for chart
            numeric_cols = df.select_dtypes(include='number').columns
            if len(numeric_cols) > 0:
                col = numeric_cols[0]
                fig = px.bar(df, x=df.index, y=col, title=f'{fname} - {col}')
                chart_html = fig.to_html(full_html=False, include_plotlyjs='cdn')
                charts[fname] = chart_html
    return charts
