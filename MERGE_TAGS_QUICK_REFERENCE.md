# Quick Reference: Merge Tags & Usernames

## Adding Recipients with Usernames

### Method 1: Manual Entry
Go to **Manage Recipients** page and enter:
```
John Smith, john@example.com, jsmith
Jane Doe, jane@example.com, jdoe
```

### Method 2: CSV Upload
Upload a CSV file with three columns:
```csv
Name,Email,Username
John Smith,john@example.com,jsmith
Jane Doe,jane@example.com,jdoe
```

### Method 3: Email Only (Optional)
You can omit name or username:
```
john@example.com
John Smith, john@example.com
```

## Using Merge Tags in Emails

### Available Tags

| Tag | Description | Example Result |
|-----|-------------|-----------------|
| `{{displayName}}` | Name if exists, else username | John Smith (if name exists) |
| `{{name}}` | Full name | John Smith |
| `{{username}}` | Username only | jsmith |
| `{{email}}` | Email address | john@example.com |
| `{{firstName}}` | First name only | John |
| `{{lastName}}` | Last name only | Smith |

### Smart {{displayName}} Priority

```
If Name exists       → Use Name
Else if Username exists → Use Username
Else                 → Leave blank
```

### Example Email

**Subject:**
```
Hi {{displayName}}, Check Out These New Features!
```

**Body:**
```
Dear {{firstName}},

We've prepared something special for you!

Your account: {{email}}

Best regards,
The Team
```

## Viewing Recipients

### Recipients Table Columns
- **Name** - Full name (if provided)
- **Username** - Username (if provided)
- **Email** - Email address (always shown)
- **Groups** - Group assignments
- **Action** - Edit/delete options

## Tips & Best Practices

✅ **Always include email** - Required for sending
✅ **Include name or username** - For proper personalization
✅ **Use {{displayName}}** - Handles all cases automatically
✅ **Test first** - Send to yourself before bulk send
✅ **Check preview** - Review email preview before sending
✅ **Sort by recent** - Payments list shows newest first

## Examples

### Welcome Email
```
Subject: Welcome {{displayName}}!

Hi {{displayName}},

Welcome to our community! We're excited to have you here.

Start exploring: [link]

Best regards,
The Team
```

### Personalized Newsletter
```
Subject: {{firstName}}, Your Weekly Update

Hi {{displayName}},

Here's what's new this week, especially for you.

[Content]

Reply to: {{email}}
```

### Event Invitation
```
Subject: {{displayName}}, You're Invited!

Dear {{displayName}},

We'd love to have you at our upcoming event.

[Details]

RSVP with: {{email}}
```

## Troubleshooting

❌ **Merge tags not replaced?**
- Make sure email subjects/content has proper tag format: `{{tagname}}`
- Check spelling (case-sensitive)

❌ **displayName showing blank?**
- Recipient needs either name or username
- Check Recipients table to verify data

❌ **Username not showing in table?**
- Might need to refresh page
- Re-import recipient with username

❌ **CSV upload errors?**
- Ensure format: Name, Email, Username (comma-separated)
- Check for invalid email addresses
- Verify no extra spaces in email field

## Contact Support

For issues with:
- Recipients import → Check format in Manage Recipients
- Email sending → Check API settings
- Merge tags → Verify tag spelling in email content
