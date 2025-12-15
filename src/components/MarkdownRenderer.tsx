import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let listType: "ul" | "ol" | null = null;

    const flushList = () => {
      if (currentList.length > 0 && listType) {
        const ListTag = listType === "ul" ? "ul" : "ol";
        elements.push(
          <ListTag key={elements.length} className={`${listType === "ul" ? "list-disc" : "list-decimal"} ml-4 mb-3 space-y-1`}>
            {currentList.map((item, idx) => (
              <li key={idx} className="text-sm leading-relaxed">
                {parseInline(item)}
              </li>
            ))}
          </ListTag>
        );
        currentList = [];
        listType = null;
      }
    };

    const parseInline = (text: string): React.ReactNode => {
      // Handle bold with **text**
      const parts: React.ReactNode[] = [];
      let remaining = text;
      let key = 0;

      while (remaining.length > 0) {
        // Check for bold **text**
        const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
        if (boldMatch && boldMatch.index !== undefined) {
          if (boldMatch.index > 0) {
            parts.push(parseItalic(remaining.slice(0, boldMatch.index), key++));
          }
          parts.push(
            <strong key={key++} className="font-semibold text-foreground">
              {boldMatch[1]}
            </strong>
          );
          remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        } else {
          parts.push(parseItalic(remaining, key++));
          break;
        }
      }
      return parts.length === 1 ? parts[0] : <>{parts}</>;
    };

    const parseItalic = (text: string, baseKey: number): React.ReactNode => {
      const parts: React.ReactNode[] = [];
      let remaining = text;
      let key = 0;

      while (remaining.length > 0) {
        // Check for italic *text* (single asterisk)
        const italicMatch = remaining.match(/\*([^*]+)\*/);
        if (italicMatch && italicMatch.index !== undefined) {
          if (italicMatch.index > 0) {
            parts.push(<span key={`${baseKey}-${key++}`}>{remaining.slice(0, italicMatch.index)}</span>);
          }
          parts.push(
            <em key={`${baseKey}-${key++}`} className="italic text-muted-foreground">
              {italicMatch[1]}
            </em>
          );
          remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
        } else {
          parts.push(<span key={`${baseKey}-${key++}`}>{remaining}</span>);
          break;
        }
      }
      return parts.length === 1 ? parts[0] : <>{parts}</>;
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Empty line
      if (trimmedLine === "") {
        flushList();
        return;
      }

      // Horizontal rule
      if (trimmedLine === "---" || trimmedLine === "***") {
        flushList();
        elements.push(<hr key={elements.length} className="my-4 border-border/50" />);
        return;
      }

      // Headers
      if (trimmedLine.startsWith("### ")) {
        flushList();
        elements.push(
          <h3 key={elements.length} className="text-base font-semibold text-foreground mt-4 mb-2">
            {parseInline(trimmedLine.slice(4))}
          </h3>
        );
        return;
      }
      if (trimmedLine.startsWith("## ")) {
        flushList();
        elements.push(
          <h2 key={elements.length} className="text-lg font-semibold text-foreground mt-4 mb-2">
            {parseInline(trimmedLine.slice(3))}
          </h2>
        );
        return;
      }
      if (trimmedLine.startsWith("# ")) {
        flushList();
        elements.push(
          <h1 key={elements.length} className="text-xl font-bold text-foreground mt-4 mb-2">
            {parseInline(trimmedLine.slice(2))}
          </h1>
        );
        return;
      }

      // Unordered list items
      if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ") || trimmedLine.startsWith("• ")) {
        if (listType !== "ul") {
          flushList();
          listType = "ul";
        }
        currentList.push(trimmedLine.slice(2));
        return;
      }

      // Ordered list items
      const orderedMatch = trimmedLine.match(/^(\d+)\.\s+(.*)$/);
      if (orderedMatch) {
        if (listType !== "ol") {
          flushList();
          listType = "ol";
        }
        currentList.push(orderedMatch[2]);
        return;
      }

      // Scripture reference (detect patterns like "Book Chapter:Verse")
      const scripturePattern = /^(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+\d+:\d+/i;

      if (scripturePattern.test(trimmedLine)) {
        flushList();
        elements.push(
          <div key={elements.length} className="my-3 p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
            <p className="text-sm font-medium text-primary mb-1">{trimmedLine.split(">")[0].trim()}</p>
            {trimmedLine.includes(">") && (
              <p className="text-sm text-muted-foreground italic">
                {parseInline(trimmedLine.split(">").slice(1).join(">").trim())}
              </p>
            )}
          </div>
        );
        return;
      }

      // Quote blocks (lines starting with >)
      if (trimmedLine.startsWith(">")) {
        flushList();
        elements.push(
          <blockquote key={elements.length} className="my-2 pl-4 border-l-4 border-primary/30 italic text-muted-foreground">
            <p className="text-sm">{parseInline(trimmedLine.slice(1).trim())}</p>
          </blockquote>
        );
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={elements.length} className="text-sm leading-relaxed mb-2">
          {parseInline(trimmedLine)}
        </p>
      );
    });

    flushList();
    return elements;
  };

  return <div className={`prose-sm ${className}`}>{parseMarkdown(content)}</div>;
};

export default MarkdownRenderer;
