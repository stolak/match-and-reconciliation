import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import * as FormData from 'form-data';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfToExcelService } from './pdf-to-excel.service';
import { Response } from 'express';
import axios from 'axios';
@Controller('pdf-to-excel')
export class PdfToExcelController {
  constructor(private readonly pdfToExcelService: PdfToExcelService) {}

  @Post('convert')
  @UseInterceptors(FileInterceptor('file'))
  async convertPdfToExcel(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ): Promise<any> {
    if (!file) {
      return res.status(400).send('No file uploaded');
    }

    // Convert the uploaded PDF to Excel
    await this.pdfToExcelService.convertPdfToExcel(file.buffer, res);
  }

  @Post('convert2')
  @UseInterceptors(FileInterceptor('file'))
  async convertPdfToExcel2(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ): Promise<void> {
    if (!file) {
      res.status(400).send('No file uploaded');
      return;
    }

    // Convert the uploaded PDF to Excel and download it
    const excelBuffer = await this.pdfToExcelService.convertPdfToExcel2(
      file.buffer,
    );

    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=converted.xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    // Send the Excel file as a response
    res.send(excelBuffer);
  }
  @Post('convert3')
  @UseInterceptors(FileInterceptor('file'))
  async convertPdfToExcel3(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ): Promise<any> {
    if (!file) {
      res.status(400).send('No file uploaded');
      return;
    }

    // Convert the uploaded PDF to Excel and download it
    return await this.pdfToExcelService.convertPdfToExcel3(file.buffer);
  }

  @Post('convert4')
  @UseInterceptors(FileInterceptor('file'))
  async convertPdfToExcel4(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ): Promise<any> {
    if (!file) {
      res.status(400).send('No file uploaded');
      return;
    }

    // Convert the uploaded PDF to Excel and download it
    return await this.pdfToExcelService.convertPdfToExcel3(file.buffer);
  }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    if (!file) {
      return res.status(400).send('No file uploaded');
    }

    try {
      // Create a FormData object to send the file to the Python server
      const formData = new FormData();
      formData.append('file', file.buffer, file.originalname);

      // Call the Python API to convert the PDF to Excel
      const response = await axios.post(
        'http://127.0.0.1:5000/convert',
        formData,
        {
          headers: formData.getHeaders(),
          responseType: 'arraybuffer',
        },
      );

      // Set response headers for Excel download
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=converted_data.xlsx',
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      return res.send(response.data);
    } catch (error) {
      console.error('Error calling Python API:', error.message);
      return res.status(500).send('Failed to convert PDF to Excel');
    }
  }
}
