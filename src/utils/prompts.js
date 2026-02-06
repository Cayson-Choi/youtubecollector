export const generatePrompt = (template) => {
  return `[NotebookLM Slide Design Request]

■ Role: Professional Presentation Designer
■ Style: ${template.name}
■ Category: ${template.category}

━━━━━━━━━━━━━━━━━━━━━━

[Color System]
• Background: ${template.style.bg}
• Text: ${template.style.text}
• Accent: ${template.style.accent}
• Font: ${template.style.font}

[Mood & Reference]
${template.mood}

[Design Characteristics]
${(template.characteristics || []).map((c) => `• ${c}`).join('\n')}

[Texture]
${template.texture}

[Layout Guide]
${template.layoutGuide}

━━━━━━━━━━━━━━━━━━━━━━

Please generate high-quality slides based on the guide above.`;
};
