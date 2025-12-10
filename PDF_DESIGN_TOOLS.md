# PDF Design Tools Guide

Here are various tools you can use to design and customize your PDF invoice:

## 1. **Online HTML/CSS Editors (Recommended for Quick Testing)**
   - **CodePen** (https://codepen.io) - Test HTML/CSS in real-time
   - **JSFiddle** (https://jsfiddle.net) - Similar to CodePen
   - **HTML/CSS to PDF converters** - Test your design before implementing

## 2. **PDF Design Software**
   - **Adobe InDesign** - Professional PDF design (paid)
   - **Canva** (https://canva.com) - Easy drag-and-drop PDF design (free/paid)
   - **Figma** (https://figma.com) - Design tool, export to PDF (free/paid)
   - **Affinity Publisher** - Alternative to InDesign (one-time purchase)

## 3. **Code-Based PDF Generation Libraries**
   - **React-PDF** (https://react-pdf.org) - Generate PDFs with React components
   - **PDFKit** (Node.js) - Programmatic PDF creation
   - **jsPDF** (JavaScript) - Client-side PDF generation
   - **Puppeteer** - Convert HTML to PDF using headless Chrome

## 4. **Template-Based Tools**
   - **Invoice Ninja** - Invoice templates
   - **Zoho Invoice** - Professional invoice templates
   - **Invoice Simple** - Free invoice templates

## 5. **For This Project (React Native)**
   Since you're using `expo-print`, you can:
   
   - **Design in HTML/CSS** (current approach) - Edit `ServiceApp/src/utils/pdfUtils.js`
   - **Use React-PDF** - More control, but requires more setup
   - **Use a template service** - Generate HTML template externally, use in app

## Quick Design Tips:
1. **A5 Size**: 148mm × 210mm (portrait) or 210mm × 148mm (landscape)
2. **Minimal Margins**: Use 2-3mm for maximum content space
3. **Font Sizes**: Keep between 5-8px for A5 to fit content
4. **Test Print**: Always test print on actual A5 paper
5. **Single Page**: Use `page-break-inside: avoid` to prevent breaks

## Current Implementation:
The PDF is generated in: `ServiceApp/src/utils/pdfUtils.js`
- Function: `generateInvoiceHTML()`
- Uses HTML/CSS with `@media print` for A5 sizing
- All styling is in the `<style>` tag within the function

## How to Customize:
1. Open `ServiceApp/src/utils/pdfUtils.js`
2. Find the `generateInvoiceHTML()` function
3. Modify the HTML structure and CSS styles
4. Test by generating a PDF in the app

## Recommended Approach:
1. **Design in CodePen/JSFiddle** - Create your ideal design
2. **Copy HTML/CSS** - Transfer to `pdfUtils.js`
3. **Test in App** - Generate PDF and verify
4. **Iterate** - Adjust margins, fonts, spacing as needed

