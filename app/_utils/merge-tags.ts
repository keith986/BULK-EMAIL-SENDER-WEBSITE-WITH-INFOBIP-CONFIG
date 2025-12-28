/**
 * Merge tags utility for personalizing email content
 */

export interface MergeData {
  name?: string;
  username?: string;
  email: string;
  [key: string]: any;
}

/**
 * Get display name from name/username with priority:
 * 1. If both exist: choose name
 * 2. If only username exists: choose username
 * 3. If only name exists: choose name
 * 4. If neither exists: empty string
 */
export function getDisplayName(recipient: { name?: string; username?: string }): string {
  if (recipient.name) {
    return recipient.name;
  } else if (recipient.username) {
    return recipient.username;
  }
  return '';
}

/**
 * Create merge data object for email personalization
 */
export function createMergeData(recipient: {
  name?: string;
  username?: string;
  email: string;
}): MergeData {
  return {
    name: recipient.name || '',
    username: recipient.username || '',
    email: recipient.email,
    displayName: getDisplayName(recipient),
    firstName: recipient.name?.split(' ')[0] || '',
    lastName: recipient.name?.split(' ').slice(1).join(' ') || ''
  };
}

/**
 * Replace merge tags in content
 * Supports: {{displayName}}, {{name}}, {{username}}, {{email}}, {{firstName}}, {{lastName}}
 */
export function replaceMergeTags(content: string, mergeData: MergeData): string {
  let result = content;

  // Replace all merge tags
  result = result.replace(/\{\{displayName\}\}/gi, mergeData.displayName);
  result = result.replace(/\{\{name\}\}/gi, mergeData.name);
  result = result.replace(/\{\{username\}\}/gi, mergeData.username);
  result = result.replace(/\{\{email\}\}/gi, mergeData.email);
  result = result.replace(/\{\{firstName\}\}/gi, mergeData.firstName);
  result = result.replace(/\{\{lastName\}\}/gi, mergeData.lastName);

  return result;
}

/**
 * Preview merge tags with sample data
 */
export function previewMergeTags(content: string): string {
  const sampleData: MergeData = {
    displayName: '[Display Name]',
    name: '[Full Name]',
    username: '[Username]',
    email: 'user@example.com',
    firstName: '[First Name]',
    lastName: '[Last Name]'
  };

  return replaceMergeTags(content, sampleData);
}

/**
 * Get list of available merge tags with descriptions
 */
export function getAvailableMergeTags() {
  return [
    { tag: '{{displayName}}', description: 'Name if exists, otherwise username' },
    { tag: '{{name}}', description: 'Full name of recipient' },
    { tag: '{{username}}', description: 'Username of recipient' },
    { tag: '{{email}}', description: 'Email address' },
    { tag: '{{firstName}}', description: 'First name only' },
    { tag: '{{lastName}}', description: 'Last name only' }
  ];
}

/**
 * Insert merge tag at cursor position or selection
 */
export function insertMergeTag(
  textElement: HTMLTextAreaElement,
  tag: string
): void {
  const start = textElement.selectionStart;
  const end = textElement.selectionEnd;
  const text = textElement.value;

  const newText = text.substring(0, start) + tag + text.substring(end);
  textElement.value = newText;

  // Move cursor after inserted tag
  textElement.selectionStart = textElement.selectionEnd = start + tag.length;
  textElement.focus();
}
