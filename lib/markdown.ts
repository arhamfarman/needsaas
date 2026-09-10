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

    // GFM-style pipe table: a row containing "|" immediately followed by a
    // separator row like |---|:---:|---:|. Supports left/center/right
    // alignment via leading/trailing colons in the separator. Cell content
    // is already HTML-escaped (the whole input was escaped up front, same
    // as every other block type here) and run through inlineMd() so links,
    // bold, etc. still work inside cells. Wrapped in a scroll container so a
    // wide table doesn't overflow the article column on narrow screens.
    const tableSeparatorRe = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/;
    if (trimmed.includes('|') && i + 1 < lines.length && tableSeparatorRe.test(lines[i + 1].trim())) {
      closeList();
      const splitRow = (row: string) =>
        row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      const headerCells = splitRow(trimmed);
      const aligns = splitRow(lines[i + 1].trim()).map((c) => {
        const left = c.startsWith(':');
        const right = c.endsWith(':');
        if (left && right) return 'center';
        if (right) return 'right';
        if (left) return 'left';
        return null;
      });
      i += 2;
      const bodyRows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes('|') && lines[i].trim() !== '') {
        bodyRows.push(splitRow(lines[i]));
        i++;
      }
      const alignAttr = (idx: number) => (aligns[idx] ? ` style="text-align:${aligns[idx]}"` : '');
      html.push('<div class="table-wrap"><table>');
      html.push(
        '<thead><tr>' +
          headerCells.map((c, idx) => `<th${alignAttr(idx)}>${inlineMd(c)}</th>`).join('') +
          '</tr></thead>'
      );
      html.push(
        '<tbody>' +
          bodyRows
            .map((row) => '<tr>' + row.map((c, idx) => `<td${alignAttr(idx)}>${inlineMd(c)}</td>`).join('') + '</tr>')
            .join('') +
          '</tbody>'
      );
      html.push('</table></div>');
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

// Extracts FAQ question/answer pairs for FAQPage structured data.
//
// blog_posts has no structured FAQ table (unlike starter_pack_faqs), so
// there's nowhere to store FAQs separately from the article body. Instead,
// authors write an H2 section titled "FAQ" or "Frequently Asked Questions",
// with each question as an H3 and its answer as the paragraph(s) that
// follow -- exactly the structure already used when outlining these
// articles. This is a plain-text scan of the raw Markdown source (not the
// rendered HTML), so JSON-LD fields never carry markup. Returns [] if the
// post has no such section, so pages without FAQs simply emit no FAQPage
// JSON-LD rather than an empty/broken one.
export function extractFaqsFromMarkdown(md: string): { question: string; answer: string }[] {
  if (!md?.trim()) return [];
  const lines = md.split('\n');
  const faqs: { question: string; answer: string }[] = [];

  let inFaqSection = false;
  let currentQuestion: string | null = null;
  let currentAnswer: string[] = [];

  const flush = () => {
    if (currentQuestion && currentAnswer.length > 0) {
      faqs.push({ question: currentQuestion.trim(), answer: currentAnswer.join(' ').trim() });
    }
    currentQuestion = null;
    currentAnswer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const h2 = line.match(/^##\s+(.*)$/);
    const h3 = line.match(/^###\s+(.*)$/);

    if (h2) {
      if (inFaqSection) {
        flush();
        break; // left the FAQ section -- nothing after it is a question
      }
      inFaqSection = /^(faq|frequently asked questions)s?$/i.test(h2[1].trim());
      continue;
    }
    if (!inFaqSection) continue;

    if (h3) {
      flush();
      currentQuestion = h3[1].trim();
      continue;
    }
    if (currentQuestion && line) {
      currentAnswer.push(line);
    }
  }
  flush();
  return faqs;
}
