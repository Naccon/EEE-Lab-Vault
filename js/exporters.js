(function bootstrapExporters(global) {
  const ns = global.EEEVault = global.EEEVault || {};
  const utils = ns.utils;
  const config = ns.config;

  function buildPrintableMarkup(report) {
    const sectionList = config.reportSections.map((section, index) => `
      <section style="margin-bottom:24px; page-break-inside: avoid;">
        <h2 style="font-size:20px; margin:0 0 10px; border-left:4px solid #0078c2; padding-left:12px;">
          ${index + 1}. ${utils.escapeHtml(section.title)}
        </h2>
        <div style="line-height:1.8;">${utils.parseRichTextToHtml(report.sections[section.key] || "Not provided.")}</div>
      </section>
    `).join("");

    const tableHead = utils.toArray(report.dataTable.headers)
      .map((header) => `<th style="padding:10px; border:1px solid #d8e2ea; text-align:left;">${utils.escapeHtml(header)}</th>`)
      .join("");

    const tableBody = utils.toArray(report.dataTable.rows)
      .map((row) => `
        <tr>${utils.toArray(row).map((cell) => `<td style="padding:10px; border:1px solid #d8e2ea;">${utils.escapeHtml(cell)}</td>`).join("")}</tr>
      `).join("");

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${utils.escapeHtml(report.title)}</title>
        <style>
          .formula-inline { white-space: nowrap; font-weight: 700; }
          .rich-table-shell { overflow-x: auto; }
          .rich-table-shell table { width: 100%; border-collapse: collapse; }
          .rich-table-shell th, .rich-table-shell td { padding: 10px; border: 1px solid #d8e2ea; text-align: left; vertical-align: top; }
          .rich-table-shell th { background: #eef6ff; }
        </style>
      </head>
      <body style="font-family: Georgia, 'Times New Roman', serif; margin: 0; padding: 0; background: #f5f7fa;">
        <main style="max-width: 900px; margin: 0 auto; background: #fff; min-height: 100vh; padding: 56px;">
          <section style="text-align:center; padding: 36px 0 48px; border-bottom: 1px solid #d8e2ea;">
            <h1 style="margin:0 0 12px; font-size:30px;">${utils.escapeHtml(config.appName)}</h1>
            <h2 style="margin:0 0 18px; font-size:24px;">${utils.escapeHtml(report.title)}</h2>
            <div style="margin: 14px auto 22px; max-width: 720px; line-height: 1.8; text-align: left;">${utils.parseRichTextToHtml(report.summary || "Not provided.")}</div>
            <p style="margin:6px 0;">Course Title: ${utils.escapeHtml(report.academic.subjectName)}</p>
            <p style="margin:6px 0;">Course Code: ${utils.escapeHtml(report.academic.subjectCode)}</p>
            <p style="margin:6px 0;">Teacher: ${utils.escapeHtml(report.academic.teacherName)} (${utils.escapeHtml(report.academic.teacherDesignation)})</p>
            <p style="margin:6px 0;">Student: ${utils.escapeHtml(report.student.studentName)} | ID: ${utils.escapeHtml(report.student.studentId)}</p>
            <p style="margin:6px 0;">Experiment No: ${utils.escapeHtml(report.experimentNo)} | Date: ${utils.escapeHtml(utils.formatDate(report.experimentDate))}</p>
          </section>

          <section style="padding: 28px 0;">
            <h2 style="font-size:22px; margin:0 0 12px;">Table of Contents</h2>
            <ol style="line-height:1.9; padding-left: 20px;">
              <li>Student Information</li>
              <li>Course Information</li>
              ${config.reportSections.map((section) => `<li>${utils.escapeHtml(section.title)}</li>`).join("")}
              <li>Circuit Diagram</li>
              <li>Data Table</li>
            </ol>
          </section>

          <section style="margin-bottom:24px;">
            <h2 style="font-size:20px; margin:0 0 10px; border-left:4px solid #0078c2; padding-left:12px;">Student Information</h2>
            <p style="margin:0 0 8px;">${utils.escapeHtml(report.student.studentName)} | ${utils.escapeHtml(report.student.studentId)}</p>
            <p style="margin:0 0 8px;">${utils.escapeHtml(report.student.studentLevel)} | ${utils.escapeHtml(report.student.studentTerm)} | ${utils.escapeHtml(report.student.studentSection)}</p>
            <p style="margin:0;">${utils.escapeHtml(report.student.studentDepartment)} | ${utils.escapeHtml(report.student.institution)}</p>
          </section>

          <section style="margin-bottom:24px;">
            <h2 style="font-size:20px; margin:0 0 10px; border-left:4px solid #0078c2; padding-left:12px;">Course Information</h2>
            <p style="margin:0 0 8px;">Course Title: ${utils.escapeHtml(report.academic.subjectName)}</p>
            <p style="margin:0 0 8px;">Course Code: ${utils.escapeHtml(report.academic.subjectCode)}</p>
            <p style="margin:0;">Teacher: ${utils.escapeHtml(report.academic.teacherName)} (${utils.escapeHtml(report.academic.teacherDesignation)})</p>
          </section>

          ${sectionList}

          <section style="margin-bottom:24px; page-break-inside: avoid;">
            <h2 style="font-size:20px; margin:0 0 10px; border-left:4px solid #0078c2; padding-left:12px;">Circuit Diagram</h2>
            ${report.circuitDiagram.dataUrl
              ? `<img src="${report.circuitDiagram.dataUrl}" alt="Circuit diagram" style="max-width:100%; border:1px solid #d8e2ea; border-radius:8px;">`
              : "<p>No circuit diagram uploaded.</p>"}
            ${report.circuitDiagram.caption ? `<p style="font-size:13px; color:#5f6b76;">${utils.escapeHtml(report.circuitDiagram.caption)}</p>` : ""}
          </section>

          <section style="margin-bottom:24px; page-break-inside: avoid;">
            <h2 style="font-size:20px; margin:0 0 10px; border-left:4px solid #0078c2; padding-left:12px;">Data Table</h2>
            <table style="width:100%; border-collapse: collapse;">
              <thead><tr>${tableHead}</tr></thead>
              <tbody>${tableBody}</tbody>
            </table>
          </section>
        </main>
      </body>
      </html>
    `;
  }

  function openPrintPreview(report) {
    const win = global.open("", "_blank", "noopener,noreferrer,width=1100,height=900");
    if (!win) {
      throw new Error("Browser blocked the export preview window.");
    }
    win.document.open();
    win.document.write(buildPrintableMarkup(report));
    win.document.close();
    win.focus();
    return win;
  }

  function addWrappedText(doc, text, x, y, maxWidth, lineHeight) {
    const lines = doc.splitTextToSize(text || "", maxWidth);
    doc.text(lines, x, y);
    return y + Math.max(1, lines.length) * lineHeight;
  }

  async function exportPdf(report) {
    if (!global.jspdf || !global.jspdf.jsPDF) {
      openPrintPreview(report);
      return { fallback: true };
    }

    const doc = new global.jspdf.jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const contentWidth = 500;
    let y = 72;

    function ensureSpace(height) {
      if (y + height < 760) {
        return;
      }
      doc.addPage();
      y = 72;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(config.appName, margin, y);
    y += 28;
    doc.setFontSize(26);
    y = addWrappedText(doc, report.title, margin, y, contentWidth, 28);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    [
      `Course Title: ${report.academic.subjectName}`,
      `Course Code: ${report.academic.subjectCode}`,
      `Teacher: ${report.academic.teacherName} (${report.academic.teacherDesignation})`,
      `Student: ${report.student.studentName} | ${report.student.studentId}`,
      `Experiment No: ${report.experimentNo} | Date: ${utils.formatDate(report.experimentDate)}`
    ].forEach((line) => {
      doc.text(line, margin, y);
      y += 18;
    });

    doc.addPage();
    y = 72;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Table of Contents", margin, y);
    y += 24;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    [
      "1. Student Information",
      "2. Course Information",
      ...config.reportSections.map((section, index) => `${index + 3}. ${section.title}`),
      `${config.reportSections.length + 3}. Circuit Diagram`,
      `${config.reportSections.length + 4}. Data Table`
    ].forEach((line) => {
      doc.text(line, margin, y);
      y += 18;
    });

    doc.addPage();
    y = 72;
    const sectionBlocks = [
      { title: "Student Information", body: `${report.student.studentName}\n${report.student.studentId}\n${report.student.studentLevel}\n${report.student.studentTerm}\n${report.student.studentSection}\n${report.student.studentDepartment}\n${report.student.institution}` },
      { title: "Course Information", body: `${report.academic.subjectName}\n${report.academic.subjectCode}\n${report.academic.teacherName}\n${report.academic.teacherDesignation}` },
      ...config.reportSections.map((section) => ({ title: section.title, body: utils.stripRichText(report.sections[section.key] || "Not provided.") }))
    ];

    sectionBlocks.forEach((section) => {
      ensureSpace(120);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(section.title, margin, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      y = addWrappedText(doc, section.body, margin, y, contentWidth, 16);
      y += 20;
    });

    if (report.circuitDiagram.dataUrl) {
      ensureSpace(240);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("Circuit Diagram", margin, y);
      y += 18;
      try {
        doc.addImage(report.circuitDiagram.dataUrl, "PNG", margin, y, 420, 210);
        y += 220;
      } catch (error) {
        y = addWrappedText(doc, "Diagram preview was unavailable in PDF export.", margin, y, contentWidth, 16);
      }
      if (report.circuitDiagram.caption) {
        doc.setFontSize(10);
        y = addWrappedText(doc, report.circuitDiagram.caption, margin, y, contentWidth, 14);
      }
      y += 12;
    }

    ensureSpace(180);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Data Table", margin, y);
    y += 12;
    if (typeof doc.autoTable === "function") {
      doc.autoTable({
        startY: y + 8,
        head: [report.dataTable.headers],
        body: report.dataTable.rows,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [0, 120, 194] }
      });
    }

    doc.save(utils.slugify(report.title) + ".pdf");
    return { fallback: false };
  }

  async function exportDocx(report) {
    if (!global.docx || !global.saveAs) {
      openPrintPreview(report);
      return { fallback: true };
    }

    const docx = global.docx;
    const children = [
      new docx.Paragraph({
        text: config.appName,
        heading: docx.HeadingLevel.TITLE,
        alignment: docx.AlignmentType.CENTER
      }),
      new docx.Paragraph({
        text: report.title,
        heading: docx.HeadingLevel.HEADING_1,
        alignment: docx.AlignmentType.CENTER
      }),
      new docx.Paragraph({
        text: `Course Title: ${report.academic.subjectName}`,
        alignment: docx.AlignmentType.CENTER
      }),
      new docx.Paragraph({
        text: `Course Code: ${report.academic.subjectCode}`,
        alignment: docx.AlignmentType.CENTER
      }),
      new docx.Paragraph({
        text: `Teacher: ${report.academic.teacherName} (${report.academic.teacherDesignation})`,
        alignment: docx.AlignmentType.CENTER
      }),
      new docx.Paragraph({
        text: `Student: ${report.student.studentName} | ID: ${report.student.studentId}`,
        alignment: docx.AlignmentType.CENTER
      }),
      new docx.Paragraph({
        text: `Experiment No: ${report.experimentNo} | Date: ${utils.formatDate(report.experimentDate)}`,
        alignment: docx.AlignmentType.CENTER
      }),
      new docx.Paragraph({ children: [new docx.PageBreak()] }),
      new docx.Paragraph({
        text: "Table of Contents",
        heading: docx.HeadingLevel.HEADING_1
      }),
      new docx.TableOfContents("Table of Contents", {
        hyperlink: true,
        headingStyleRange: "1-3"
      }),
      new docx.Paragraph({ children: [new docx.PageBreak()] }),
      new docx.Paragraph({ text: "Student Information", heading: docx.HeadingLevel.HEADING_1 }),
      new docx.Paragraph(`${report.student.studentName} | ${report.student.studentId}`),
      new docx.Paragraph(`${report.student.studentLevel} | ${report.student.studentTerm} | ${report.student.studentSection}`),
      new docx.Paragraph(`${report.student.studentDepartment} | ${report.student.institution}`),
      new docx.Paragraph({ text: "Course Information", heading: docx.HeadingLevel.HEADING_1 }),
      new docx.Paragraph(`Course Title: ${report.academic.subjectName}`),
      new docx.Paragraph(`Course Code: ${report.academic.subjectCode}`),
      new docx.Paragraph(`Teacher: ${report.academic.teacherName}`),
      new docx.Paragraph(`Designation: ${report.academic.teacherDesignation}`)
    ];

    config.reportSections.forEach((section) => {
      children.push(new docx.Paragraph({
        text: section.title,
        heading: docx.HeadingLevel.HEADING_1
      }));
      children.push(new docx.Paragraph({ text: utils.stripRichText(report.sections[section.key] || "Not provided.") }));
    });

    children.push(new docx.Paragraph({
      text: "Circuit Diagram",
      heading: docx.HeadingLevel.HEADING_1
    }));

    if (report.circuitDiagram.dataUrl) {
      try {
        children.push(new docx.Paragraph({
          children: [
            new docx.ImageRun({
              data: utils.base64ToUint8Array(report.circuitDiagram.dataUrl),
              transformation: { width: 460, height: 240 }
            })
          ]
        }));
      } catch (error) {
        children.push(new docx.Paragraph({ text: "Diagram preview could not be embedded in this DOCX export." }));
      }
    } else {
      children.push(new docx.Paragraph({ text: "No circuit diagram uploaded." }));
    }

    if (report.circuitDiagram.caption) {
      children.push(new docx.Paragraph({ text: report.circuitDiagram.caption }));
    }

    const tableRows = [
      new docx.TableRow({
        children: report.dataTable.headers.map((header) => new docx.TableCell({
          children: [new docx.Paragraph({
            children: [new docx.TextRun({ text: header, bold: true })]
          })]
        }))
      }),
      ...report.dataTable.rows.map((row) => new docx.TableRow({
        children: row.map((cell) => new docx.TableCell({
          children: [new docx.Paragraph({ text: String(cell || "") })]
        }))
      }))
    ];

    children.push(new docx.Paragraph({
      text: "Data Table",
      heading: docx.HeadingLevel.HEADING_1
    }));
    children.push(new docx.Table({
      rows: tableRows,
      width: {
        size: 100,
        type: docx.WidthType.PERCENTAGE
      }
    }));

    const documentFile = new docx.Document({
      sections: [{
        properties: {},
        children
      }]
    });

    const blob = await docx.Packer.toBlob(documentFile);
    global.saveAs(blob, utils.slugify(report.title) + ".docx");
    return { fallback: false };
  }

  ns.exporters = {
    buildPrintableMarkup,
    exportDocx,
    exportPdf,
    openPrintPreview
  };
}(window));
