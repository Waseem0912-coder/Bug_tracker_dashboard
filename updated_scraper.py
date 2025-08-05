from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

url = "https://issuetracker.google.com/issues/399131921"

print(f"Attempting to navigate to: {url}")

driver = webdriver.Chrome()

issue_title = "Not found"
issue_description_text = "Not found" # Renamed to avoid confusion with the dictionary
issue_comments_data = []

try:
    driver.get(url)
    print(f"Successfully navigated. Page title: {driver.title}")
    time.sleep(2) # Add a small explicit sleep after page load, sometimes helps with SPAs

    # --- Get Title ---
    issue_title = driver.title
    if " [" in issue_title and "] - Issue Tracker" in issue_title:
        issue_title = issue_title.split(" [")[0]
    print(f"Extracted Issue Title: {issue_title}")

    # --- Get Description (Initial Report / Comment #1) ---
    try:
        description_container_locator = (By.ID, "comment1")
        print("Waiting for description container (comment1)...")
        description_container_element = WebDriverWait(driver, 20).until(
            EC.visibility_of_element_located(description_container_locator)
        )
        print("Description container (comment1) found.")

        desc_text_element = description_container_element.find_element(By.CSS_SELECTOR, ".type-m.markdown-display")
        issue_description_text = desc_text_element.text # Store the main description text

        # Correctly scope the search for author and time within the description_container_element
        desc_author_element = description_container_element.find_element(By.CSS_SELECTOR, "b-user-display-name")
        desc_time_element = description_container_element.find_element(By.CSS_SELECTOR, "b-formatted-date-time time")

        issue_comments_data.append({
            "author": desc_author_element.text.strip() if desc_author_element else "Unknown",
            "timestamp_details": desc_time_element.get_attribute("title") if desc_time_element else "Unknown",
            "text": issue_description_text,
            "comment_id": "comment1 (Description)"
        })
        print(f"Extracted Description (Comment #1) details.")

    except Exception as e:
        print(f"Could not extract description (Comment #1) details: {e}")
        # If this fails, try to get at least the description text if the container was found
        if 'description_container_element' in locals() and not issue_description_text:
            try:
                desc_text_element_fallback = description_container_element.find_element(By.CSS_SELECTOR, ".type-m.markdown-display")
                issue_description_text = desc_text_element_fallback.text
                print("Fallback: Extracted only description text.")
            except:
                print("Fallback: Failed to get description text either.")


    # --- Get Subsequent Comments ---
    try:
        comments_list_container_locator = (By.TAG_NAME, "issue-event-list")
        print("Waiting for main comments container (issue-event-list)...")
        comments_list_element = WebDriverWait(driver, 20).until(
            EC.presence_of_element_located(comments_list_container_locator)
        )
        print("Main comments container (issue-event-list) found.")
        time.sleep(1) # Give a moment for its children to potentially render

        # Find all 'b-history-event' elements that are comments
        # These are direct children of 'div.bv2-event' which are children of 'div.bv2-edit-issue-history-stream'
        # Let's target 'b-history-event' elements that have an 'id' starting with 'comment'
        # Or more broadly, all 'b-history-event' elements within the stream and filter.

        # Path: issue-event-list -> b-event-stream -> div.bv2-edit-issue-history-stream -> div.bv2-event -> b-history-event
        history_event_elements_xpath = ".//div[contains(@class, 'bv2-event')]//b-history-event"
        print(f"Looking for history events with XPath: {history_event_elements_xpath} within issue-event-list")

        # Wait for at least one such event to be present to ensure the list has populated
        WebDriverWait(comments_list_element, 15).until(
            EC.presence_of_element_located((By.XPATH, history_event_elements_xpath))
        )
        
        all_history_events = comments_list_element.find_elements(By.XPATH, history_event_elements_xpath)
        print(f"Found {len(all_history_events)} total b-history-event elements.")

        for event_element in all_history_events:
            comment_id = event_element.get_attribute("id") # Get id if present

            # Attempt to find the comment text area. If it exists, it's likely a text comment.
            # Otherwise, it might be a status change, assignment, etc.
            try:
                comment_text_element = event_element.find_element(By.CSS_SELECTOR, ".type-m.markdown-display")
                comment_text = comment_text_element.text

                # If we found text, it's a comment we want. Now get author and time.
                author_element = event_element.find_element(By.CSS_SELECTOR, "b-user-display-name")
                time_element = event_element.find_element(By.CSS_SELECTOR, "b-formatted-date-time time")
                
                current_comment_id = comment_id if comment_id else f"Event (no specific ID, text found)"

                # Avoid re-adding comment1 if it was picked up here
                if current_comment_id == "comment1" and any(c['comment_id'] == "comment1 (Description)" for c in issue_comments_data):
                    print(f"Skipping {current_comment_id} as it's already processed as description.")
                    continue

                issue_comments_data.append({
                    "author": author_element.text.strip() if author_element else "Unknown",
                    "timestamp_details": time_element.get_attribute("title") if time_element else "Unknown",
                    "text": comment_text,
                    "comment_id": current_comment_id
                })
                print(f"Extracted text comment: {current_comment_id}")

            except Exception: # NoSuchElementException if .markdown-display not found
                # This event is not a text comment (e.g., just an assignment, status change)
                if comment_id:
                    print(f"Event '{comment_id}' is not a text comment or details missing, skipping text extraction.")
                else:
                    print("Found a b-history-event without text content or ID, skipping text extraction.")
                continue

    except Exception as e:
        print(f"Could not extract subsequent comments: {e}")
        import traceback
        traceback.print_exc()


except Exception as e_outer:
    print(f"An outer error occurred during Selenium operations: {e_outer}")
    import traceback
    traceback.print_exc()

finally:
    print("\n--- Final Extracted Data ---")
    print(f"Title: {issue_title}")
    print(f"\nDescription (Initial Comment):\n{issue_description_text}")
    print(f"\nAll Comments/Events with Text:")
    if issue_comments_data:
        for i, comment_data in enumerate(issue_comments_data):
            print(f"  --- Entry {i+1} (ID: {comment_data['comment_id']}) ---")
            print(f"  Author: {comment_data['author']}")
            print(f"  Timestamp Details: {comment_data['timestamp_details']}")
            print(f"  Text:\n{comment_data['text']}\n")
    else:
        print("  No comments found or extracted.")

    print("Quitting driver.")
    if 'driver' in locals() and driver:
        driver.quit()