"use client";
import { useState, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Eye, PenLine, Send } from 'lucide-react';

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
  const [htmlContent, setHtmlContent] = useState('')

  useEffect(() => {
    updateHtml();
  }, [text, fontSize, textColor, bgColor, alignment, padding, borderWidth, borderColor, borderRadius, fontFamily, bold, italic, underline]);

  const updateHtml = () => {
    let fontWeight = bold ? 'bold' : 'normal';
    let fontStyle = italic ? 'italic' : 'normal';
    let textDecoration = underline ? 'underline' : 'none';

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
            <td style="padding: ${padding}px; text-align: ${alignment}; font-size: ${fontSize}px; color: ${textColor}; font-family: ${fontFamily}; font-weight: ${fontWeight}; font-style: ${fontStyle}; text-decoration: ${textDecoration}; line-height: 1.6;">
              ${text.replace(/\n/g, '<br>')}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
    
   setHtmlContent(html);
  };

  if (showPreview) {
    return (
      <div className="rounded-lg border-2 border-gray-200 overflow-hidden mt-40 m-10 ml-70">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">Email Preview</p>
         <button
         onClick={() => setShowPreview(!showPreview)}
         className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
         >
         <PenLine className="w-4 h-4" />
         {showPreview ? 'Edit' : 'Preview'} 
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
        <div className="sm:mt-21 bg-gradient-to-br from-red-200 to-slate-500 min-h-screen p-4 sm:ml-64">
    <div className="sm:grid sm:grid-cols-2 sm:gap-4">
    <div className="sm:col-span-2 flex flex-row">
        <svg className="w-10 h-10 text-blue-800 dark:text-blue ml-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="m3.5 5.5 7.893 6.036a1 1 0 0 0 1.214 0L20.5 5.5M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"/>
        </svg>
        <div className="ml-6">
        <h2 className="text-lg font-semibold">Compose & Send Campaign</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create your email content and add recipients.
        </p>
        </div>
    </div>
    <div className="sm:col-span-1 mt-4">
        <input type="text" className="w-full p-2 border border-white rounded-md outline-none" placeholder="Subject" />
    </div>
    <div className="sm:col-span-1 mt-4">
        <input type="text" className="w-full p-2 border border-white rounded-md outline-none" placeholder="Recipient Email" />
    </div>
   {/*<div className="col-span-2 mt-4"><textarea className="w-full p-2 border border-gray-300 rounded-md" rows={6} placeholder="Type your message here..."></textarea></div>*/}

      {/* Text Content Editor */}
      <div className="sm:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Content</label>
        <div className="flex items-center justify-between mb-3">
         <h2 className="text-lg font-semibold text-gray-700">Email Content Editor</h2>
         <button
         onClick={() => setShowPreview(!showPreview)}
         className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
         >
         <Eye className="w-4 h-4" />
         {showPreview ? 'Edit' : 'Preview'} 
         </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none"
          placeholder="Enter your email content..."
        />
      </div>

      {/* Formatting Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">Text Formatting</label>
        
        {/* Bold, Italic, Underline, Alignment Buttons */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button 
            onClick={() => setBold(!bold)} 
            className={`p-2 rounded ${bold ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setItalic(!italic)} 
            className={`p-2 rounded ${italic ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setUnderline(!underline)} 
            className={`p-2 rounded ${underline ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <Underline className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          <button 
            onClick={() => setAlignment('left')} 
            className={`p-2 rounded ${alignment === 'left' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setAlignment('center')} 
            className={`p-2 rounded ${alignment === 'center' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setAlignment('right')} 
            className={`p-2 rounded ${alignment === 'right' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Style Controls Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Font Family */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
            <select 
              value={fontFamily} 
              onChange={(e) => setFontFamily(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Verdana, sans-serif">Verdana</option>
              <option value="Helvetica, sans-serif">Helvetica</option>
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
            <input 
              type="number" 
              value={fontSize} 
              onChange={(e) => setFontSize(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm" 
              min="8" 
              max="72" 
            />
          </div>

          {/* Text Color */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={textColor} 
                onChange={(e) => setTextColor(e.target.value)} 
                className="w-12 h-9 border border-gray-300 rounded cursor-pointer" 
              />
              <input 
                type="text" 
                value={textColor} 
                onChange={(e) => setTextColor(e.target.value)} 
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm" 
              />
            </div>
          </div>

          {/* Background Color */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={bgColor} 
                onChange={(e) => setBgColor(e.target.value)} 
                className="w-12 h-9 border border-gray-300 rounded cursor-pointer" 
              />
              <input 
                type="text" 
                value={bgColor} 
                onChange={(e) => setBgColor(e.target.value)} 
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm" 
              />
            </div>
          </div>

          {/* Padding */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Padding</label>
            <input 
              type="number" 
              value={padding} 
              onChange={(e) => setPadding(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm" 
              min="0" 
              max="100" 
            />
          </div>

          {/* Border Width */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Border Width</label>
            <input 
              type="number" 
              value={borderWidth} 
              onChange={(e) => setBorderWidth(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm" 
              min="0" 
              max="20" 
            />
          </div>

          {/* Border Color */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Border Color</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={borderColor} 
                onChange={(e) => setBorderColor(e.target.value)} 
                className="w-12 h-9 border border-gray-300 rounded cursor-pointer" 
              />
              <input 
                type="text" 
                value={borderColor} 
                onChange={(e) => setBorderColor(e.target.value)} 
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm" 
              />
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
            <input 
              type="number" 
              value={borderRadius} 
              onChange={(e) => setBorderRadius(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm" 
              min="0" 
              max="50" 
            />
          </div>
        </div>
      </div>
    
    <div className="sm:col-span-2 mt-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex"><Send className='mr-4' /> Send Bulk Email Campaign</button>
    </div>
    </div>
        </div>
    );

}