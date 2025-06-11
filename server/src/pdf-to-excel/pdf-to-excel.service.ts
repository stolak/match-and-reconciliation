import { Injectable, BadRequestException } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class PdfToExcelService {
  async convertPdfToExcel(pdfBuffer: Buffer, res: Response): Promise<void> {
    try {
      const pdfData = await pdfParse(pdfBuffer);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('PDF Data');

      const lines = pdfData.text.split('\n');
      lines.forEach((line) => worksheet.addRow([line.trim()]));

      worksheet.columns.forEach((column) => (column.width = 50));

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename=output.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      throw new BadRequestException('Error converting PDF to Excel');
    }
  }
  async convertPdfToExcel2(pdfBuffer: Buffer): Promise<Buffer> {
    try {
      const pdfData = await pdfParse(pdfBuffer);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('PDF Data');

      // Split PDF text into lines and add them to Excel rows
      const lines = pdfData.text.split('\n');
      lines.forEach((line) => worksheet.addRow([line.trim()]));
      console.log(lines[10]);
      console.log(lines);
      worksheet.columns.forEach((column) => (column.width = 50));

      // Convert Excel to Uint8Array and then to Buffer
      const excelUint8Array = await workbook.xlsx.writeBuffer();
      const excelBuffer = Buffer.from(excelUint8Array); // Convert to Buffer

      return excelBuffer;
    } catch (error) {
      throw new BadRequestException('Error converting PDF  to Excel');
    }
  }
  async extractTableFromPDF(data) {
    // Extract the text content
    const text = data.text;

    const lines = text.split('\n');

    let headers = [];
    let tableData = [];
    let currentRow = [];
    let isHeaderDetected = false;

    // Iterate through lines to detect headers and data
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Ignore empty lines
      if (!line) continue;

      // Split line into columns (adjust regex based on your table structure)
      const columns = line.match(/\S+/g) || [];

      // If columns are detected, process the line
      if (columns.length > 2) {
        // If headers are not yet detected, treat the first valid row as headers
        if (!isHeaderDetected) {
          headers = columns;
          isHeaderDetected = true;
        } else {
          // Check if current line has the same number of columns as the header
          if (columns.length === headers.length) {
            // Commit the previous row and start a new one
            if (currentRow.length > 0) {
              tableData.push(currentRow);
            }
            currentRow = columns; // Start a new row
          } else {
            // This line is likely a continuation of the previous row
            currentRow = currentRow.concat(columns);
          }
        }
      }
    }

    // Add the last row if present
    if (currentRow.length > 0) {
      tableData.push(currentRow);
    }

    // Handle cases where headers were not found
    if (headers.length === 0) {
      throw new Error(
        'Failed to detect table headers. Please adjust the extraction logic.',
      );
    }

    return { headers, tableData };
  }

  async convertPdfToExcel3(pdfBuffer: Buffer): Promise<any> {
    try {
      const pdfData = await pdfParse(pdfBuffer);
      const res = await this.extractTableFromPDF(pdfData);
      console.log(res);
      return res;
    } catch (error) {
      throw new BadRequestException('Error converting PDF  to Excel');
    }
  }
}
