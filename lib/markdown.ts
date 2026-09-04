// Minimal, dependency-free Markdown → HTML renderer.
//
// Extracted from app/admin/blog/page.tsx so the admin preview and the public
// blog pages render identically from one implementation. Deliberately not a
// full CommonMark implementation — just enough syntax (headings, bold/italic,
// strikethrough, inline code, links, images, fenced code blocks, block
// quotes, ordered/unordered lists, horizontal rules) for editorial content.
//
// Safety: the input is HTML-escaped *before* any markdown syntax is
// converted, so raw HTML typed into a post body can never inject markup —
// only the tags this function itself emits ever reach dangerouslySetInnerHTML.
// Writing to blog_posts is already restricted to admins by RLS, so this is a
// belt-and-suspenders escape rather than the only line of defense.

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineMd(text: string): string {
  let t = text;
  // images: ![alt](url "title")
  t = t.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_m, alt, url, title) =>
      `<img src="${url}" alt="${alt}"${title ? ` title="${title}"` : ''} />`
  );
  // links: [label](url "title")
  t = t.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_m, label, url, title) =>
      `<a href="${url}"${title ? ` title="${title}"` : ''}>${label}</a>`
  );
  // bold **text** or __text__
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  // italic *text* or _text_
  t = t.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  t = t.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
  // strikethrough ~~text~~
  t = t.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  // inline code `code`
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  return t;
}

export function markdownToHtml(md: string): string {
  if (!md?.trim())
    return '<p style="color:#999">Nothing to preview yet.</p>';
  const escaped = escapeHtml(md);
  const lines = escaped.split('\n');
  const html: string[] = [];
  let i = 0;
  let listTag: string | null = null;

  const closeList = () => {
    if (listTag) {
      html.push(`</${listTag}>`);
      listTag = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Fenced code block
    if (trimmed.startsWith('```')) {
      closeList();
      const lang = trimmed.slice(3).trim();
      i++;
      const buf: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      html.push(
        `<pre><code${
          lang ? ` class="language-${lang}"` : ''
        }>${buf.join('\n')}</code></pre>`
      );
      continue;
    }

    // Heading
    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closeList();
      const lvl = h[1].length;
      html.push(`<h${lvl}>${inlineMd(h[2])}</h${lvl}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeList();
      html.push('<hr />');
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('&gt;')) {
      closeList();
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('&gt;')) {
        buf.push(
          `<p>${inlineMd(lines[i].trim().replace(/^&gt;\s?/, ''))}</p>`
        );
        i++;
      }
      html.push(`<blockquote>${buf.join('')}</blockquote>`);
      continue;
    }

    // Unordered list item
    if (/^[-*+]\s+/.test(trimmed)) {
      if (listTag !== 'ul') {
        closeList();
        html.push('<ul>');
        listTag = 'ul';
      }
      html.push(`<li>${inlineMd(trimmed.replace(/^[-*+]\s+/, ''))}</li>`);
      i++;
      continue;
    }

    // Ordered list item
    if (/^\d+\.\s+/.test(trimmed)) {
      if (listTag !== 'ol') {
        closeList();
        html.push('<ol>');
        listTag = 'ol';
      }
      html.push(`<li>${inlineMd(trimmed.replace(/^\d+\.\s+/, ''))}</li>`);
      i++;
      continue;
    }

    // Blank line
    if (trimmed === '') {
      closeList();
      i++;
      continue;
    }

    // Paragraph
    closeList();
    html.push(`<p>${inlineMd(trimmed)}</p>`);
    i++;
  }
  closeList();
  return html.join('\n');
}
