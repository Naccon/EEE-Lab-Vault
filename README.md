# EEE Lab Vault — BAUST Khulna
### Department of Electrical & Electronic Engineering

---

## 🚀 HOW TO RUN

### Option A — Simple (No backend, just open in browser)
1. Copy these 3 files into a folder:
   - `index.html`
   - `style.css`
   - `script.js`
2. Double-click `index.html` to open in Chrome/Edge
3. All data saves to **localStorage** automatically

### Option B — With Node.js Backend (for local folder access)
1. Make sure Node.js is installed: https://nodejs.org
2. Put all 4 files in a folder:
   - `index.html`, `style.css`, `script.js`, `server.js`
3. Open terminal in that folder and run:
   ```
   node server.js
   ```
4. Open browser at: **http://localhost:3001**

---

## ✨ FEATURES

| Feature | Description |
|---|---|
| **Create Reports** | Full lab report with Objective, Theory, Data, Results, Conclusion |
| **Edit Reports** | Click ✏ on any card or inside viewer |
| **Delete Reports** | Confirmation dialog before delete |
| **Draft Auto-save** | Auto-saves every 20 seconds while composing |
| **Academic Settings** | Save your name, ID, batch, teacher info — auto-fills forms |
| **Category Filter** | Sidebar filters by subject |
| **Search** | Real-time search by title, subject, experiment no. |
| **Sort** | By date, subject, done, draft |
| **PDF Export** | Opens print dialog with academic cover page |
| **DOCX Export** | Downloads `.doc` file with full cover page |
| **Local Files** | Browse a local folder and open HTML/PDF/DOCX reports |
| **localStorage** | All reports persist after page reload |

---

## 📚 SUBJECTS INCLUDED

- Circuit Analysis (EEE-211)
- Electronics I (EEE-213)
- Power Systems (EEE-215)
- Signals & Systems (EEE-217)
- Programming Lab (CSE-219)
- Engineering Mathematics (MATH-211)

---

## 📁 FILE STRUCTURE

```
eee-lab-vault/
├── index.html   ← Main UI
├── style.css    ← All styles
├── script.js    ← All logic + export
├── server.js    ← Optional Node.js backend
└── README.md    ← This file
```

---

## 💡 TIPS

- **First time:** Click ⚙ (Settings) in the top-right and fill in your student info.
  This auto-fills the PDF cover page every time.
- **Local Files:** In Chrome/Edge, click 📁 in the sidebar → select your report folder.
  Files open directly in the browser.
- **PDF Export:** Opens a print window. Choose "Save as PDF" as the destination.
- **DOCX Export:** Downloads a `.doc` file openable in MS Word.

---

**BAUST Khulna | EEE Department | 2nd Year 1st Semester**
