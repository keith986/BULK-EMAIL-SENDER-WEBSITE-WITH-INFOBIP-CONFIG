"use client";
import Protected from '../_components/Protected';
import { useState, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Eye, PenLine, Send, Users, FileText, Plus, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { fetchRecipientsFromFirebase, fetchGroupsFromFirebase } from '../_utils/firebase-operations';
import {toast, ToastContainer} from 'react-toastify';
import { useUser } from '../_context/UserProvider';

interface Recipient {
  name: string;
  email: string;
  groups?: string[];
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  text: string;
  fontSize: string;
  textColor: string;
  bgColor: string;
  alignment: string;
  padding: string;
  borderWidth: string;
  borderColor: string;
  borderRadius: string;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  imageUrl?: string;
  imagePosition?: 'top' | 'bottom' | 'left' | 'right';
  imageWidth?: string;
}

// Sample email templates
const sampleTemplates: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to Our Community!',
    text: 'Hi there!\n\nWe\'re thrilled to have you join our community. Thank you for signing up!\n\nGet started by exploring our features and don\'t hesitate to reach out if you need any help.\n\nBest regards,\nThe Team',
    fontSize: '16',
    textColor: '#333333',
    bgColor: '#ffffff',
    alignment: 'left',
    padding: '30',
    borderWidth: '2',
    borderColor: '#4F46E5',
    borderRadius: '8',
    fontFamily: 'Arial, sans-serif',
    bold: false,
    italic: false,
    underline: false
  },
  {
    id: 'newsletter',
    name: 'Newsletter Template',
    subject: 'Monthly Newsletter - {{Month}}',
    text: 'Hello!\n\nHere\'s what\'s new this month:\n\n• Feature updates\n• Community highlights\n• Upcoming events\n\nStay tuned for more exciting updates!\n\nCheers,\nYour Newsletter Team',
    fontSize: '16',
    textColor: '#1a1a1a',
    bgColor: '#f8f9fa',
    alignment: 'left',
    padding: '25',
    borderWidth: '0',
    borderColor: '#cccccc',
    borderRadius: '12',
    fontFamily: 'Georgia, serif',
    bold: false,
    italic: false,
    underline: false
  },
  {
    id: 'promotional',
    name: 'Promotional Offer',
    subject: 'Special Offer Just for You!',
    text: 'EXCLUSIVE OFFER\n\nDon\'t miss out on our limited-time promotion!\n\nGet 30% OFF on all premium features this week only.\n\nUse code: SAVE30\n\nOffer expires soon - Act now!',
    fontSize: '18',
    textColor: '#ffffff',
    bgColor: '#DC2626',
    alignment: 'center',
    padding: '35',
    borderWidth: '0',
    borderColor: '#cccccc',
    borderRadius: '15',
    fontFamily: 'Helvetica, sans-serif',
    bold: true,
    italic: false,
    underline: false
  },
  {
    id: 'announcement',
    name: 'Company Announcement',
    subject: 'Important Update',
    text: 'Dear Valued Customer,\n\nWe have an important announcement to share with you.\n\n[Your announcement details here]\n\nThank you for your continued support.\n\nSincerely,\nManagement Team',
    fontSize: '16',
    textColor: '#2c3e50',
    bgColor: '#ecf0f1',
    alignment: 'left',
    padding: '28',
    borderWidth: '1',
    borderColor: '#3498db',
    borderRadius: '5',
    fontFamily: 'Verdana, sans-serif',
    bold: false,
    italic: false,
    underline: false
  },
  {
    id: 'event',
    name: 'Event Invitation',
    subject: 'You\'re Invited!',
    text: 'YOU\'RE INVITED!\n\nJoin us for an exclusive event:\n\nDate: [Event Date]\nTime: [Event Time]\nLocation: [Event Location]\n\nRSVP by [RSVP Date]\n\nWe look forward to seeing you there!',
    fontSize: '17',
    textColor: '#4a5568',
    bgColor: '#fef3c7',
    alignment: 'center',
    padding: '32',
    borderWidth: '3',
    borderColor: '#f59e0b',
    borderRadius: '10',
    fontFamily: 'Arial, sans-serif',
    bold: false,
    italic: false,
    underline: false
  }
];

export default function Compose () {
  const [text, setText] = useState('Your message here...');
  const [fontSize, setFontSize] = useState('16');
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [alignment, setAlignment] = useState('left');
  const [padding, setPadding] = useState('20');
  const [borderWidth, setBorderWidth] = useState('0');
  const [borderColor, setBorderColor] = useState('#cccccc');
  const [borderRadius, setBorderRadius] = useState('0');
  const [fontFamily, setFontFamily] = useState('Arial, sans-serif');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState<string>('');
  const [sendLoading, setSendLoading] = useState<boolean>(false);
  const { user } = useUser();
  
  // Group selection states
  const [groups, setGroups] = useState<string[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState<string>('');
  const [showGroupDropdown, setShowGroupDropdown] = useState<boolean>(false);
  const [filteredGroups, setFilteredGroups] = useState<string[]>([]);
  
  // Template states
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState<boolean>(false);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [customTemplates, setCustomTemplates] = useState<EmailTemplate[]>([]);
  
  // Image states
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePosition, setImagePosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [imageWidth, setImageWidth] = useState<string>('200');
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<string>('');
  
  // Draft states
  const [drafts, setDrafts] = useState<EmailTemplate[]>([]);
  const [showDraftsModal, setShowDraftsModal] = useState<boolean>(false);
  const [showSaveDraftModal, setShowSaveDraftModal] = useState<boolean>(false);
  const [draftName, setDraftName] = useState<string>('');
  
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    
    // Fetch recipients
    setRecipientsLoading(true);
    fetchRecipientsFromFirebase({ userId: uid })
      .then((data) => {
        setRecipients(data?.data?.recipients ?? []);
      })
      .catch((err) => console.error('Error fetching recipients:', err instanceof Error ? err.message : String(err)))
      .finally(() => setRecipientsLoading(false));
    
    // Fetch groups
    fetchGroupsFromFirebase({ userId: uid })
      .then((result) => {
        if (result.code === 777 && result.data?.groups) {
          setGroups(result.data.groups);
        }
      })
      .catch((err) => console.error('Error fetching groups:', err instanceof Error ? err.message : String(err)));
    
    // Load custom templates from localStorage
    const savedTemplates = localStorage.getItem(`emailTemplates_${uid}`);
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        setCustomTemplates(parsed);
      } catch (err) {
        console.error('Error loading templates:', err);
      }
    }
    
    // Load drafts from localStorage
    const savedDrafts = localStorage.getItem(`emailDrafts_${uid}`);
    if (savedDrafts) {
      try {
        const parsed = JSON.parse(savedDrafts);
        setDrafts(parsed);
      } catch (err) {
        console.error('Error loading drafts:', err);
      }
    }
  }, [user?.uid]);

  // Filter groups based on search query
  useEffect(() => {
    if (groupSearchQuery.trim()) {
       const filtered = groups.filter(g => g.toLowerCase().includes(groupSearchQuery.toLowerCase()));
       setFilteredGroups(filtered);
      } else {
       setFilteredGroups(groups);
      }
  }, [groupSearchQuery, groups]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q) {
      setSearchResults([]);
      return;
    }
    const resp = recipients.filter(r => {
      const email = (r.email || '').toLowerCase();
      const name = (r.name || '').toLowerCase();
      return email.includes(q.toLowerCase()) || name.includes(q.toLowerCase());
    });
    setSearchResults(resp);
  }

  const addRecipient = (r: Recipient) => {
    if (!r || !r.email) return;
    setSelectedRecipients(prev => {
      if (prev.find(p => p.email === r.email)) return prev;
      return [...prev, r];
    });
    setSearchQuery('');
    setSearchResults([]);
  }

  const addTypedRecipient = () => {
    const val = searchQuery.trim();
    if (!val) return;
    const newRecipient = { email: val, name: val };
    addRecipient(newRecipient);
  }

  const addAllSearchResults = () => {
    setSelectedRecipients(prev => {
      const emails = new Set(prev.map(p => p.email));
      const merged = [...prev];
      searchResults.forEach(r => {
        if (!emails.has(r.email)) merged.push(r);
      });
      return merged;
    });
    setSearchQuery('');
    setSearchResults([]);
  }

  const removeSelected = (email: string) => {
    setSelectedRecipients(prev => prev.filter(p => p.email !== email));
  }

  const addGroupRecipients = (groupName: string) => {
    const groupRecipients = recipients.filter(r => 
      r.groups && r.groups.includes(groupName)
    );
    
    if (groupRecipients.length === 0) {
      toast.info(`No recipients found in group "${groupName}"`);
      return;
    }

    setSelectedRecipients(prev => {
      const emails = new Set(prev.map(p => p.email));
      const merged = [...prev];
      let addedCount = 0;
      
      groupRecipients.forEach(r => {
        if (!emails.has(r.email)) {
          merged.push(r);
          addedCount++;
        }
      });
      
      if (addedCount > 0) {
        toast.success(`Added ${addedCount} recipient(s) from group "${groupName}"`);
      } else {
        toast.info(`All recipients from "${groupName}" are already selected`);
      }
      
      return merged;
    });
    
    setGroupSearchQuery('');
    setShowGroupDropdown(false);
  }

  const addCustomGroup = () => {
    const groupName = groupSearchQuery.trim();
    if (!groupName) return;
    
    if (groups.includes(groupName)) {
      addGroupRecipients(groupName);
    } else {
      toast.info(`Group "${groupName}" doesn't exist yet. Create it in the Recipients page first.`);
    }
    
    setGroupSearchQuery('');
    setShowGroupDropdown(false);
  }

  // Image functions
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setUploadedImage(base64String);
      setImageUrl(base64String);
      toast.success('Image uploaded successfully');
    };
    reader.readAsDataURL(file);
  }

  const addImageToEmail = () => {
    if (!imageUrl && !uploadedImage) {
      toast.error('Please provide an image URL or upload an image');
      return;
    }
    setShowImageModal(false);
    toast.success('Image added to email');
  }

  const removeImage = () => {
    setImageUrl('');
    setUploadedImage('');
    toast.info('Image removed from email');
  }

  // Template functions
  const loadTemplate = (template: EmailTemplate) => {
    setText(template.text);
    setSubject(template.subject);
    setFontSize(template.fontSize);
    setTextColor(template.textColor);
    setBgColor(template.bgColor);
    setAlignment(template.alignment);
    setPadding(template.padding);
    setBorderWidth(template.borderWidth);
    setBorderColor(template.borderColor);
    setBorderRadius(template.borderRadius);
    setFontFamily(template.fontFamily);
    setBold(template.bold);
    setItalic(template.italic);
    setUnderline(template.underline);
    setImageUrl(template.imageUrl || '');
    setImagePosition(template.imagePosition || 'top');
    setImageWidth(template.imageWidth || '200');
    toast.success(`Template "${template.name}" loaded successfully`);
  }

  const saveAsTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    const newTemplate: EmailTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      subject,
      text,
      fontSize,
      textColor,
      bgColor,
      alignment,
      padding,
      borderWidth,
      borderColor,
      borderRadius,
      fontFamily,
      bold,
      italic,
      underline,
      imageUrl: imageUrl || uploadedImage,
      imagePosition,
      imageWidth
    };

    const updatedCustomTemplates = [...customTemplates, newTemplate];
    setCustomTemplates(updatedCustomTemplates);
    
    if (user?.uid) {
      localStorage.setItem(`emailTemplates_${user.uid}`, JSON.stringify(updatedCustomTemplates));
    }

    toast.success(`Template "${newTemplateName}" saved successfully`);
    setNewTemplateName('');
    setShowSaveTemplateModal(false);
  }

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = customTemplates.filter(t => t.id !== templateId);
    setCustomTemplates(updatedTemplates);
    
    if (user?.uid) {
      localStorage.setItem(`emailTemplates_${user.uid}`, JSON.stringify(updatedTemplates));
    }
    
    toast.success('Template deleted successfully');
  }

  // Draft functions
  const saveAsDraft = () => {
    const name = draftName.trim() || `Draft ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

    const newDraft: EmailTemplate = {
      id: Date.now().toString(),
      name,
      subject,
      text,
      fontSize,
      textColor,
      bgColor,
      alignment,
      padding,
      borderWidth,
      borderColor,
      borderRadius,
      fontFamily,
      bold,
      italic,
      underline,
      imageUrl: imageUrl || uploadedImage,
      imagePosition,
      imageWidth
    };

    const updatedDrafts = [...drafts, newDraft];
    setDrafts(updatedDrafts);
    
    if (user?.uid) {
      localStorage.setItem(`emailDrafts_${user.uid}`, JSON.stringify(updatedDrafts));
    }

    toast.success(`Draft "${name}" saved successfully`);
    setDraftName('');
    setShowSaveDraftModal(false);
  }

  const loadDraft = (draft: EmailTemplate) => {
    setText(draft.text);
    setSubject(draft.subject);
    setFontSize(draft.fontSize);
    setTextColor(draft.textColor);
    setBgColor(draft.bgColor);
    setAlignment(draft.alignment);
    setPadding(draft.padding);
    setBorderWidth(draft.borderWidth);
    setBorderColor(draft.borderColor);
    setBorderRadius(draft.borderRadius);
    setFontFamily(draft.fontFamily);
    setBold(draft.bold);
    setItalic(draft.italic);
    setUnderline(draft.underline);
    setImageUrl(draft.imageUrl || '');
    setImagePosition(draft.imagePosition || 'top');
    setImageWidth(draft.imageWidth || '200');
    setShowDraftsModal(false);
    toast.success(`Draft "${draft.name}" loaded successfully`);
  }

  const deleteDraft = (draftId: string) => {
    const updatedDrafts = drafts.filter(d => d.id !== draftId);
    setDrafts(updatedDrafts);
    
    if (user?.uid) {
      localStorage.setItem(`emailDrafts_${user.uid}`, JSON.stringify(updatedDrafts));
    }
    
    toast.success('Draft deleted successfully');
  }

  useEffect(() => {
    const fontWeight = bold ? 'bold' : 'normal';
    const fontStyle = italic ? 'italic' : 'normal';
    const textDecoration = underline ? 'underline' : 'none';
    const finalImageUrl = uploadedImage || imageUrl;

    let imageHtml = '';
    if (finalImageUrl) {
      if (imagePosition === 'left' || imagePosition === 'right') {
        imageHtml = `
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              ${imagePosition === 'left' ? `
                <td width="${imageWidth}" style="padding-right: 20px;" valign="top">
                  <img src="${finalImageUrl}" alt="Email Image" style="width: ${imageWidth}px; height: auto; display: block; border-radius: 8px;" />
                </td>
                <td style="text-align: ${alignment}; font-size: ${fontSize}px; color: ${textColor}; font-family: ${fontFamily}; font-weight: ${fontWeight}; font-style: ${fontStyle}; text-decoration: ${textDecoration}; line-height: 1.6;" valign="top">
                  ${text.replace(/\n/g, '<br>')}
                </td>
              ` : `
                <td style="text-align: ${alignment}; font-size: ${fontSize}px; color: ${textColor}; font-family: ${fontFamily}; font-weight: ${fontWeight}; font-style: ${fontStyle}; text-decoration: ${textDecoration}; line-height: 1.6;" valign="top">
                  ${text.replace(/\n/g, '<br>')}
                </td>
                <td width="${imageWidth}" style="padding-left: 20px;" valign="top">
                  <img src="${finalImageUrl}" alt="Email Image" style="width: ${imageWidth}px; height: auto; display: block; border-radius: 8px;" />
                </td>
              `}
            </tr>
          </table>
        `;
      } else {
        const topImage = imagePosition === 'top' ? `
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${finalImageUrl}" alt="Email Image" style="max-width: ${imageWidth}px; width: 100%; height: auto; display: inline-block; border-radius: 8px;" />
          </div>
        ` : '';
        const bottomImage = imagePosition === 'bottom' ? `
          <div style="text-align: center; margin-top: 20px;">
            <img src="${finalImageUrl}" alt="Email Image" style="max-width: ${imageWidth}px; width: 100%; height: auto; display: inline-block; border-radius: 8px;" />
          </div>
        ` : '';
        imageHtml = `
          ${topImage}
          <div style="text-align: ${alignment}; font-size: ${fontSize}px; color: ${textColor}; font-family: ${fontFamily}; font-weight: ${fontWeight}; font-style: ${fontStyle}; text-decoration: ${textDecoration}; line-height: 1.6;">
            ${text.replace(/\n/g, '<br>')}
          </div>
          ${bottomImage}
        `;
      }
    } else {
      imageHtml = `
        <div style="text-align: ${alignment}; font-size: ${fontSize}px; color: ${textColor}; font-family: ${fontFamily}; font-weight: ${fontWeight}; font-style: ${fontStyle}; text-decoration: ${textDecoration}; line-height: 1.6;">
          ${text.replace(/\n/g, '<br>')}
        </div>
      `;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #847e7eff; font-family: ${fontFamily};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: ${bgColor}; border: ${borderWidth}px solid ${borderColor}; border-radius: ${borderRadius}px;">
          <tr>
            <td style="padding: ${padding}px;">
              ${imageHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

    setHtmlContent(html);
  }, [text, fontSize, textColor, bgColor, alignment, padding, borderWidth, borderColor, borderRadius, fontFamily, bold, italic, underline, imageUrl, uploadedImage, imagePosition, imageWidth]);

  if (showPreview) {
    return (
      <div className="rounded-lg border-2 border-gray-200 overflow-hidden mt-40 m-4 md:mt-50 md:ml-70 md:m-10 sm:mt-50 sm:ml-70">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">Email Preview</p>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <PenLine className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </div>
    );
  }

  return (
    <Protected>
      <div className="bg-gradient-to-br from-red-200 to-slate-500 min-h-screen p-4">
        <div className="p-4 sm:ml-64 mt-20 ">
          <ToastContainer position="top-right" autoClose={7000} hideProgressBar={false} closeOnClick draggable pauseOnHover theme={"light"} />
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-row items-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-800 dark:text-blue ml-2 sm:ml-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="m3.5 5.5 7.893 6.036a1 1 0 0 0 1.214 0L20.5 5.5M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"/>
              </svg>
              <div className="ml-4 sm:ml-6">
                <h2 className="text-lg sm:text-xl font-semibold">Compose & Send Campaign</h2>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                  Create your email content and add recipients.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDraftsModal(true)}
              className="px-3 sm:px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">My Drafts</span> ({drafts.length})
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Email Templates Column */}
            <div className="lg:col-span-1 bg-white rounded-lg p-4 border border-gray-200 max-h-[600px] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm sm:text-md font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  Email Templates
                </h3>
                <button
                  onClick={() => setShowSaveTemplateModal(true)}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  title="Save current as template"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Sample Templates */}
              <div className="mb-4">
                <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Sample Templates</h4>
                <div className="space-y-2">
                  {sampleTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => loadTemplate(template)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium text-xs sm:text-sm text-gray-800">{template.name}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{template.subject}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Templates */}
              {customTemplates.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">My Templates</h4>
                  <div className="space-y-2">
                    {customTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <button
                          onClick={() => loadTemplate(template)}
                          className="flex-1 text-left"
                        >
                          <p className="font-medium text-xs sm:text-sm text-gray-800">{template.name}</p>
                          <p className="text-xs text-gray-500 mt-1 truncate">{template.subject}</p>
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <input 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    type="text" 
                    className="w-full p-2 sm:p-3 border border-white rounded-md outline-none text-sm sm:text-base" 
                    placeholder="Subject" 
                  />
                </div>
                
                {/* Group Selection */}
                <div className="sm:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Select by Group</label>
                  <div className="relative">
                    <div className="flex items-center gap-2 p-2 border border-white rounded-md bg-white">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        type="text"
                        value={groupSearchQuery}
                        onChange={(e) => {
                          setGroupSearchQuery(e.target.value);
                          setShowGroupDropdown(true);
                        }}
                        onFocus={() => setShowGroupDropdown(true)}
                        placeholder="Search or type group name"
                        className="flex-1 outline-none px-2 py-1 bg-transparent text-sm"
                      />
                      
                      {groupSearchQuery && filteredGroups.length === 0 && (
                        <button 
                          onClick={addCustomGroup} 
                          title="Try to add this group" 
                          className="px-2 py-1 bg-green-500 text-white rounded hover:scale-95 cursor-pointer text-xs"
                        >
                          ✓
                        </button>
                      )}
                    </div>

                    {showGroupDropdown && filteredGroups.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md z-20 max-h-40 overflow-y-auto shadow-lg">
                        {filteredGroups.map((group) => {
                          const count = recipients.filter(r => r.groups?.includes(group)).length;
                          return (
                            <button
                              key={group}
                              onClick={() => addGroupRecipients(group)}
                              className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-100 flex items-center justify-between"
                            >
                              <span className="font-medium">{group}</span>
                              <span className="text-xs text-gray-500">({count} recipients)</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recipients Selection */}
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Recipients ({selectedRecipients.length} selected)
                  </label>
                  <div className="relative">
                    <div className="flex flex-wrap items-center gap-2 p-2 border border-white rounded-md bg-white min-h-[50px]">
                      {selectedRecipients.map((r) => (
                        <span key={r.email} className="flex items-center bg-gray-100 text-gray-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm max-w-[170px] truncate">
                          <span className="truncate mr-2">{r.name || r.email}</span>
                          <button onClick={() => removeSelected(r.email)} className="ml-1 text-xs text-gray-500 hover:text-gray-700">✕</button>
                        </span>
                      ))}
                      
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleChange}
                        placeholder="Search email"
                        className="flex-1 min-w-[140px] outline-none px-2 py-1 bg-transparent text-sm"
                      />

                      {searchQuery && searchResults.length === 0 && (
                        <button onClick={addTypedRecipient} title="Add typed recipient" className="ml-2 px-2 py-1 bg-green-500 text-white rounded hover:scale-95 cursor-pointer text-xs">✓</button>
                      )}
                    
                      {recipientsLoading && searchQuery && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md z-20 max-h-40 overflow-y-auto px-3 py-2 text-xs sm:text-sm">Loading recipients…</div>
                      )}
                    </div>

                    {searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md z-20 max-h-40 overflow-y-auto">
                        <button onClick={addAllSearchResults} className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-100 font-semibold text-purple-600">Add all results</button>
                        {searchResults.map((recipient, index) => (
                          <button
                            key={recipient.email || index}
                            onClick={() => addRecipient(recipient)}
                            className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-100 truncate"
                          >
                            {recipient.name ? `${recipient.name} — ${recipient.email}` : recipient.email}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Text Content Editor */}
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email Content</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-700">Email Content Editor</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setShowImageModal(true)}
                        className="flex-1 sm:flex-none flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm"
                      >
                        <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        {imageUrl || uploadedImage ? 'Edit' : 'Add'}
                      </button>
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex-1 sm:flex-none flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        Preview
                      </button>
                    </div>
                  </div>
                  
                  {(imageUrl || uploadedImage) && (
                    <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={uploadedImage || imageUrl} 
                          alt="Email preview" 
                          className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded"
                        />
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-700">Image added</p>
                          <p className="text-xs text-gray-500">Position: {imagePosition} | Width: {imageWidth}px</p>
                        </div>
                      </div>
                      <button
                        onClick={removeImage}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={6}
                    className="w-full px-3 sm:px-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none text-sm sm:text-base"
                    placeholder="Enter your email content..."
                  />
                </div>

                {/* Formatting Toolbar */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Text Formatting</label>
                  
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <button 
                      onClick={() => setBold(!bold)} 
                      className={`p-2 rounded ${bold ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      <Bold className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button 
                      onClick={() => setItalic(!italic)} 
                      className={`p-2 rounded ${italic ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      <Italic className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button 
                      onClick={() => setUnderline(!underline)} 
                      className={`p-2 rounded ${underline ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      <Underline className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    
                    <button 
                      onClick={() => setAlignment('left')} 
                      className={`p-2 rounded ${alignment === 'left' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      <AlignLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button 
                      onClick={() => setAlignment('center')} 
                      className={`p-2 rounded ${alignment === 'center' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      <AlignCenter className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button 
                      onClick={() => setAlignment('right')} 
                      className={`p-2 rounded ${alignment === 'right' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      <AlignRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
                      <select 
                        value={fontFamily} 
                        onChange={(e) => setFontFamily(e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm"
                      >
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="'Courier New', monospace">Courier New</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                        <option value="Helvetica, sans-serif">Helvetica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                      <input 
                        type="number" 
                        value={fontSize} 
                        onChange={(e) => setFontSize(e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm" 
                        min="8" 
                        max="72" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={textColor} 
                          onChange={(e) => setTextColor(e.target.value)} 
                          className="w-10 sm:w-12 h-9 border border-gray-300 rounded cursor-pointer" 
                        />
                        <input 
                          type="text" 
                          value={textColor} 
                          onChange={(e) => setTextColor(e.target.value)} 
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={bgColor} 
                          onChange={(e) => setBgColor(e.target.value)} 
                          className="w-10 sm:w-12 h-9 border border-gray-300 rounded cursor-pointer" 
                        />
                        <input 
                          type="text" 
                          value={bgColor} 
                          onChange={(e) => setBgColor(e.target.value)} 
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Padding</label>
                      <input 
                        type="number" 
                        value={padding} 
                        onChange={(e) => setPadding(e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm" 
                        min="0" 
                        max="100" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Border Width</label>
                      <input 
                        type="number" 
                        value={borderWidth} 
                        onChange={(e) => setBorderWidth(e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm" 
                        min="0" 
                        max="20" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Border Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={borderColor} 
                          onChange={(e) => setBorderColor(e.target.value)} 
                          className="w-10 sm:w-12 h-9 border border-gray-300 rounded cursor-pointer" 
                        />
                        <input 
                          type="text" 
                          value={borderColor} 
                          onChange={(e) => setBorderColor(e.target.value)} 
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
                      <input 
                        type="number" 
                        value={borderRadius} 
                        onChange={(e) => setBorderRadius(e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm" 
                        min="0" 
                        max="50" 
                      />
                    </div>
                  </div>
                </div>
                          
                <div className="sm:col-span-2 mt-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setShowSaveDraftModal(true)}
                      className="w-full sm:w-auto px-4 py-2 sm:py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                    >
                      <FileText className="w-4 h-4" />
                      Save as Draft
                    </button>
                    <button onClick={async () => {
                      try {
                        setSendLoading(true);
                        const toSend = selectedRecipients.length > 0 ? selectedRecipients : recipients;
                        const payload = { userId: user?.uid, subject: subject || '', html: htmlContent, recipients: toSend };
                        const res = await fetch('/api/send', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload)
                        });
                        const contentType = res.headers.get('content-type') || '';
                        if (contentType.includes('application/json')) {
                          const data = await res.json();
                          if (data.code === 777) {
                            toast.success('Send completed');
                          } else {
                            toast.error('Error: ' + (data.message || JSON.stringify(data)));
                          }
                        } else {
                          const bodyText = await res.text();
                          console.error('Send API returned non-JSON response:', res.status, res.statusText, bodyText.slice(0, 200));
                          toast.error(`Send failed: check your API configuration and try again. Status ${res.status} ${res.statusText}`);
                        }
                      } catch(err) {
                        toast.error('Error: ' + (err instanceof Error ? err.message : String(err)));
                      } finally {
                        setSendLoading(false);
                      }
                    }} className="flex-1 px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 cursor-pointer justify-center text-sm sm:text-base">
                      {sendLoading ? 'Sending...' : (<><Send className='w-4 h-4'/> Send Bulk Email Campaign</>)}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
 
        {/* Add Image Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 overflow-y-auto max-h-[90vh]">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Add Image to Email</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Image URL</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="text-xs sm:text-sm text-gray-500">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max size: 2MB</p>
                </div>

                {(imageUrl || uploadedImage) && (
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Preview:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={uploadedImage || imageUrl} 
                      alt="Preview" 
                      className="max-w-full h-auto rounded"
                      onError={() => toast.error('Failed to load image')}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Image Position</label>
                  <select
                    value={imagePosition}
                    onChange={(e) => setImagePosition(e.target.value as 'top' | 'bottom' | 'left' | 'right')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-2">Image Width (px)</label>
                  <input
                    type="number"
                    value={imageWidth}
                    onChange={(e) => setImageWidth(e.target.value)}
                    min="50"
                    max="600"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={() => {
                    setShowImageModal(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={addImageToEmail}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  Add Image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Template Modal */}
        {showSaveTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Save as Template</h3>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Enter template name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 text-sm"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowSaveTemplateModal(false);
                    setNewTemplateName('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAsTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Draft Modal */}
        {showSaveDraftModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Save as Draft</h3>
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Enter draft name (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 text-sm"
                autoFocus
              />
              <p className="text-xs text-gray-500 mb-4">If left empty, a timestamp will be used</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowSaveDraftModal(false);
                    setDraftName('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAsDraft}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                >
                  Save Draft
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Drafts Modal */}
        {showDraftsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold">My Drafts</h3>
                <button
                  onClick={() => setShowDraftsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {drafts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm sm:text-base text-gray-500">No drafts saved yet</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Save your work in progress to continue later</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="flex items-start justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <button
                          onClick={() => loadDraft(draft)}
                          className="text-left w-full"
                        >
                          <p className="font-medium text-gray-800">{draft.name}</p>
                          <p className="text-sm text-gray-600 mt-1 truncate">{draft.subject || 'No subject'}</p>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{draft.text}</p>
                        </button>
                      </div>
                      <button
                        onClick={() => deleteDraft(draft.id)}
                        className="ml-3 p-2 text-red-500 hover:bg-red-50 rounded"
                        title="Delete draft"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
      </div>
      </div>
    </Protected>
  );
};