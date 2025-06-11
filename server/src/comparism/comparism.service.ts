import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReconciliationSourceRepository } from './reconciliation-source.repository';
import { CreateReconciliationInput } from './inputs/create-reconciliation-input';
import { DynamicField } from 'src/customized/types/dynamic-variable';
import { CreateMultipleReconciliationInput } from './inputs/create-multiple-reconciliation-input';
import { UpdateReconciliationInput } from './inputs/updatereconciliation-input';
import {
  ReconciliationSource,
  ReconciliationSourceDocument,
} from './reconciliation-source.schema';
import { MatchRecord } from './type/match-record.type';
import { v4 as uuid } from 'uuid';
import axios from 'axios';

interface inputType {
  record1: string;
  record2: string;
}

@Injectable()
export class ComparismService {
  constructor(
    private reconciliationSourceRepository: ReconciliationSourceRepository,
    @InjectModel(ReconciliationSource.name)
    private reconciliationSourceModel: Model<ReconciliationSourceDocument>,
  ) {}
  private readonly openAiApiUrl = 'https://api.openai.com/v1/chat/completions';

  private dynamicToString(dynamic: DynamicField[]): string {
    try {
      return dynamic.map((item) => `${item.name}: ${item.value}`).join(' ');
    } catch (error) {
      return null;
    }
  }
  private chunkArray(array: any[], chunkSize: number) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  }
  private stringToObectArray(str: string): MatchRecord[] {
    try {
      const regex =
        /Record1 itemid: ([\w-]+) matches Record2 itemid: ([\w-]+)/g;

      const result = [];
      let match;

      while ((match = regex.exec(str)) !== null) {
        result.push({ primaryRecord: match[1], secondaryRecord: match[2] });
      }
      return result;
    } catch (error) {
      throw new Error(`Error comparing records: ${error.message}`);
    }
  }

  async create(
    input: CreateReconciliationInput,
    userId: string,
    ref: string = null,
  ): Promise<ReconciliationSource> {
    let refId = ref ? ref : input.refId;

    try {
      return this.reconciliationSourceRepository.createWithBase({
        ...input,
        ...(refId === null || refId === undefined
          ? { refId: uuid() }
          : { refId }),
        userId,
        comparismDetails:
          this.dynamicToString(input.dynamicFields) || input.fileDescription,
      });
    } catch (error) {
      throw new Error(`Error creating record: ${error.message}`);
    }
  }
  async createMultiple(
    userId: string,
    source: CreateMultipleReconciliationInput,
    generalRefId: string = null,
    isPrimary: boolean = true,
  ): Promise<ReconciliationSource[]> {
    try {
      const refId = generalRefId || source.refId || uuid();
      const promiseRes = source.mutilpleDynamicFields.map((record) =>
        this.create(
          {
            dynamicFields: record,
            fileDescription: source.fileDescription,
            projectDescription: source.projectDescription,
            isPrimary,
          },
          userId,
          refId,
        ),
      );
      await Promise.all(promiseRes);
      return this.reconciliationSourceRepository.find({ refId, isPrimary });
    } catch (error) {
      return [];
    }
  }
  async compareRecords(record1: string, record2: string): Promise<string> {
    const prompt = `losely Compare the following two records and return "yes" if they refer to the same thing, even if the wording is different. If they do not refer to the same thing, return "no". Do not provide any explanations.\n\nRecord 1: ${record1}\nRecord 2: ${record2}`;
    try {
      return this.compare(prompt, '');
    } catch (error) {
      throw new Error(`Error comparing records: ${error.message}`);
    }
  }

  async compareRecords2(record: inputType[]): Promise<string> {
    const result = record
      .map(
        (item, index) =>
          `${index + 1}. "${item.record1}" and "${item.record2}"`,
      )
      .join('\n');

    const prompt = `Compare the following records and return "yes" for each if they refer to the same thing, even if the wording is different. If they do not refer to the same thing, return "no". Keep the response short, in this format:
    1. No
    2. Yes
    3. Yes
  
  ${result}`;
    try {
      return this.compare(prompt, '');
    } catch (error) {
      throw new Error(`Error comparing records: ${error.message}`);
    }
  }

  async compareRecords3(
    record1: inputType[],
    record2: inputType[],
  ): Promise<string> {
    const result1 = record1
      .map((item, index) => `${index + 1}. "${item.record1}"`)
      .join('\n');

    const result2 = record2
      .map((item, index) => `${index + 1}. "${item.record2}"`)
      .join('\n');

    const prompt = `Compare the Items in  Record1 with Record2 and return number of the item in Record2 that matches individual items in Record1 if they refer to the same thing, even if the wording is different. If any of the item in Record1 does not refer to the same thing in Record2, return "0". Keep the response short, in this format:
    Record1 item 1. matches Record2 item 2
    Record1 item 2. matches Record2 item 0
    Record1 item 3. matches Record2 item 3
  
  \nRecord1: ${result1}
  \nRecord2: ${result2}`;

    try {
      return this.compare(prompt, '');
    } catch (error) {
      throw new Error(`Error comparing records: ${error.message}`);
    }
  }

  async compareRecords4(refId: string): Promise<string> {
    const record1 = await this.reconciliationSourceRepository.find({
      isPrimary: true,
      refId,
    });
    const record2 = await this.reconciliationSourceRepository.find({
      isPrimary: false,
      refId,
    });
    const result1 = record1
      .map((item, index) => `${index + 1}. "${item.comparismDetails}"`)
      .join('\n');

    const result2 = record2
      .map((item, index) => `${index + 1}. "${item.comparismDetails}"`)
      .join('\n');

    const prompt = `Compare the Items in  Record1 with Record2 and return number of the item in Record2 that matches individual items in Record1 if they refer to the same thing, even if the wording is different. If any of the item in Record1 does not refer to the same thing in Record2, return "0". Keep the response short, in this format:
    Record1 item 1. matches Record2 item 2
    Record1 item 2. matches Record2 item 0
    Record1 item 3. matches Record2 item 3
  
  \nRecord1: ${result1}
  \nRecord2: ${result2}`;

    try {
      return this.compare(prompt, '');
    } catch (error) {
      throw new Error(`Error comparing records: ${error.message}`);
    }
  }

  async getRecordsByRefId(refId: string): Promise<ReconciliationSource[]> {
    return this.reconciliationSourceRepository.find({
      refId,
    });
  }

  async getRecordsByRefIdandSource(
    refId: string,
    userId: string,
    isPrimary: boolean = true,
  ): Promise<ReconciliationSource[]> {
    return this.reconciliationSourceRepository.find({
      isPrimary,
      refId,
      userId,
    });
  }

  async update(
    input: UpdateReconciliationInput,
  ): Promise<ReconciliationSource> {
    console.log(input);
    if (input?.matchId?.length > 0) {
      await Promise.all(
        input.matchId.map((record) =>
          this.reconciliationSourceRepository.findOneAndUpdate(
            { id: record },
            { matchId: [input.id] },
          ),
        ),
      );
    }

    if (input?.matchId && input.matchId?.length === 0) {
      this.reconciliationSourceRepository.updateMany(
        { matchId: { $in: [input.id] } },
        { matchId: [] },
      );
    }
    return this.reconciliationSourceRepository.findOneAndUpdate(
      { id: input.id },
      input,
    );
  }

  async delete(deleteInput: string[]): Promise<{ message: string }> {
    console.log(deleteInput);

    this.reconciliationSourceRepository.deleteMany({
      id: { $in: deleteInput },
    });

    return { message: 'Successfully deleted' };
  }

  async getDistinctDescriptionsAndRefIds(id: string): Promise<
    {
      description: string;
      refId: string;
      mainCount?: number;
      targetCount?: number;
      mainMatched?: number;
      targetMatched?: number;
    }[]
  > {
    return this.reconciliationSourceModel
      .aggregate([
        {
          $match: { userId: id },
        },
        {
          $group: {
            _id: { projectDescription: '$projectDescription', refId: '$refId' },
            records: { $push: '$$ROOT' },
            firstCreatedAt: { $first: '$createdAt' }, // Capture the first createdAt date
          },
        },
        {
          $addFields: {
            mainCount: {
              $size: {
                $filter: {
                  input: '$records',
                  as: 'record',
                  cond: { $eq: ['$$record.isPrimary', true] },
                },
              },
            },
            targetCount: {
              $size: {
                $filter: {
                  input: '$records',
                  as: 'record',
                  cond: { $eq: ['$$record.isPrimary', false] },
                },
              },
            },
            mainMatched: {
              $size: {
                $filter: {
                  input: '$records',
                  as: 'record',
                  cond: {
                    $and: [
                      { $eq: ['$$record.isPrimary', true] },
                      { $gt: [{ $size: '$$record.matchId' }, 0] },
                    ],
                  },
                },
              },
            },
            targetMatched: {
              $size: {
                $filter: {
                  input: '$records',
                  as: 'record',
                  cond: {
                    $and: [
                      { $eq: ['$$record.isPrimary', false] },
                      { $gt: [{ $size: '$$record.matchId' }, 0] },
                    ],
                  },
                },
              },
            },
          },
        },
        {
          // Sort by the captured createdAt date
          $sort: { firstCreatedAt: -1 },
        },
        {
          $project: {
            _id: 0,
            description: '$_id.projectDescription',
            refId: '$_id.refId',
            mainCount: 1,
            targetCount: 1,
            mainMatched: 1,
            targetMatched: 1,
            createdAt: '$firstCreatedAt', // Include the first createdAt if needed
          },
        },
      ])
      .exec();
  }

  async compareRecordsOptimised(refId: string): Promise<void> {
    const record1 = await this.reconciliationSourceRepository.find({
      isPrimary: true,
      refId,
      matchId: [],
    });
    const record2 = await this.reconciliationSourceRepository.find({
      isPrimary: false,
      refId,
      matchId: [],
    });

    try {
      const chunks1 = this.chunkArray(record1, 5);
      const chunks2 = this.chunkArray(record2, 5);
// console.log(  chunks1, chunks2);
return
      // Loop through each chunk in chunks1 and each chunk in  chunks2
      const comparisonPromises: Promise<MatchRecord[]>[] = [];

      for (const chunk1 of chunks1) {
        for (const chunk2 of chunks2) {
          // Push each comparison as a promise
          const comparisonPromise = this.finallyMatch(chunk1, chunk2).then(
            (objArr) => this.saveRecordMatched(objArr),
          );

          comparisonPromises.push(comparisonPromise);
        }
      }

      // Wait for all comparisons to finish
      await Promise.all(comparisonPromises);
    } catch (error) {
      console.error('Error comparing records:', error);
    }
  }

  // Helper function to chunk an array into specified size

  async saveRecordMatched(objArr: MatchRecord[]): Promise<MatchRecord[]> {
    try {
      const recordUpdate = objArr.map((rec) => {
        const updates = [];

        // Conditionally add the first update only if rec.record2 is not 0
        if (rec.secondaryRecord !== '0') {
          updates.push(
            this.reconciliationSourceRepository.findOneAndUpdate(
              { id: rec.primaryRecord },
              { matchId: [rec.secondaryRecord] },
            ),
          );
          updates.push(
            this.reconciliationSourceRepository.findOneAndUpdate(
              { id: rec.secondaryRecord },
              { matchId: [rec.primaryRecord] },
            ),
          );
        }

        // Always add the second update

        // Return a Promise.all for both updates
        return Promise.all(updates);
      });

      // Await all the record update promises
      await Promise.all(recordUpdate);

      console.log(objArr);
      return objArr;
    } catch (error) {
      throw new Error(`Error comparing records: ${error.message}`);
    }
  }
  async finallyMatch(
    record1: ReconciliationSource[],
    record2: ReconciliationSource[],
  ): Promise<MatchRecord[]> {
    try {
      const result1 = record1
        .map(
          (item) => `itemid: ${item.id}, details: "${item.comparismDetails}"`,
        )
        .join('\n');

      const result2 = record2
        .map(
          (item) => `itemid: ${item.id}, details: "${item.comparismDetails}"`,
        )
        .join('\n');

      const prompt = `Compare the Items in  Record1 with Record2 and return number of the item in Record2 that matches individual items in Record1 if they refer to the same thing, even if the wording is different. If any of the item in Record1 does not refer to the same thing in Record2, return "0". Keep the response short 
      Do not match any record with difference transaction amount
      please note that amount, credit and debit mean the same thing as transaction amount , the response format should follow:
    Record1 itemid: 1 matches Record2 itemid: 2
    Record1 itemid: 2 matches Record2 itemid: 0
    Record1 itemid: 3 matches Record2 itemid: 3
  
  \nRecord1: ${result1}
  \nRecord2: ${result2}`;

      const result = await this.compare(prompt, '');
      return this.stringToObectArray(result);
    } catch (error) {
      throw new Error(`Error comparing records: ${error.message}`);
    }
  }

  //Experiment

  async compare(prompt: string, model: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    try {
      const response = await axios.post(
        this.openAiApiUrl,
        {
          model: model || 'gpt-4', //model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are an AI that compares records for equality for the purpose of account/transaction reconciliation, even with different wording.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      throw new Error(`Error comparing records: ${error.message}`);
    }
  }
  async compareRecords5Old(refId: string): Promise<null> {
    const record1 = await this.reconciliationSourceRepository.find({
      isPrimary: true,
      refId,
      matchId: [],
    });
    const record2 = await this.reconciliationSourceRepository.find({
      isPrimary: false,
      refId,
      matchId: [],
    });
    const result1 = record1
      .map((item) => `itemid: ${item.id}, details: "${item.comparismDetails}"`)
      .join('\n');

    const result2 = record2
      .map((item) => `itemid: ${item.id}, details: "${item.comparismDetails}"`)
      .join('\n');

    const prompt = `Compare the items in Record1 with those in Record2. For each item in Record1, return the item number from Record2 that refers to the same thing, even if the wording is different. 

IMPORTANT: Two records can only be considered a match if their "amount" values are exactly the same. If the amounts differ, they should not be matched under any circumstance.

If no matching item is found in Record2, return "0". Format the response like this:

Record1 itemid: <id> matches Record2 itemid: <id or 0>

Example:
Record1 itemid: 1 matches Record2 itemid: 2
Record1 itemid: 2 matches Record2 itemid: 0
Record1 itemid: 3 matches Record2 itemid: 3

\nRecord1: ${result1}
\nRecord2: ${result2}`;


    try {
      const result = await this.compare(prompt, '');
      const objArr = this.stringToObectArray(result);
      const recordUpdate = objArr.map((rec) => {
        const updates = [];

        // Conditionally add the first update only if rec.record2 is not 0
        if (rec.secondaryRecord !== '0') {
          updates.push(
            this.reconciliationSourceRepository.findOneAndUpdate(
              { id: rec.primaryRecord },
              { matchId: [rec.secondaryRecord] },
            ),
          );
        }

        // Always add the second update
        updates.push(
          this.reconciliationSourceRepository.findOneAndUpdate(
            { id: rec.secondaryRecord },
            { matchId: [rec.primaryRecord] },
          ),
        );

        // Return a Promise.all for both updates
        return Promise.all(updates);
      });

      // Await all the record update promises
      await Promise.all(recordUpdate);

      // console.log(objArr);
      return ;
    } catch (error) {
      throw new Error(`Error comparing records: ${error.message}`);
    }
  }

    async compareRecords5Old250604(refId: string): Promise<null> {
    const record1 = await this.reconciliationSourceRepository.find({
      isPrimary: true,
      refId,
      matchId: [],
    });
    const record2 = await this.reconciliationSourceRepository.find({
      isPrimary: false,
      refId,
      matchId: [],
    });
    const result1 = record1
      .map((item) => `itemid: ${item.id}, details: "${item.comparismDetails}"`)
      .join('\n');

    const result2 = record2
      .map((item) => `itemid: ${item.id}, details: "${item.comparismDetails}"`)
      .join('\n');

    const prompt = `Compare the Items in  Record1 with Record2 and return number of the item in Record2 that matches individual items in Record1 if they refer to the same thing, even if the wording is different. 
    If any of the item in Record1 does not refer to the same thing in Record2, return "0". Keep the response short, in this format:
    Record1 itemid: 1 matches Record2 itemid: 2
    Record1 itemid: 2 matches Record2 itemid: 0
    Record1 itemid: 3 matches Record2 itemid: 3
    
  \nRecord1: ${result1}
  \nRecord2: ${result2}`;

    try {
      const result = await this.compare(prompt, '');
      const objArr = this.stringToObectArray(result);
      const recordUpdate = objArr.map((rec) => {
        const updates = [];

        // Conditionally add the first update only if rec.record2 is not 0
        if (rec.secondaryRecord !== '0') {
          updates.push(
            this.reconciliationSourceRepository.findOneAndUpdate(
              { id: rec.primaryRecord },
              { matchId: [rec.secondaryRecord] },
            ),
          );
        }

        // Always add the second update
        updates.push(
          this.reconciliationSourceRepository.findOneAndUpdate(
            { id: rec.secondaryRecord },
            { matchId: [rec.primaryRecord] },
          ),
        );

        // Return a Promise.all for both updates
        return Promise.all(updates);
      });

      // Await all the record update promises
      await Promise.all(recordUpdate);

      // console.log(objArr);
      return ;
    } catch (error) {
      throw new Error(`Error comparing records: ${error.message}`);
    }
  }
  async compareRecords5(refId: string): Promise<string> {
    const record1 = await this.reconciliationSourceRepository.find({
      isPrimary: true,
      refId,
      matchId: [],
    });
    const record2 = await this.reconciliationSourceRepository.find({
      isPrimary: false,
      refId,
      matchId: [],
    });
    const result1 = record1
      .map((item) => `itemid: ${item.id}, details: "${item.comparismDetails}"`)
      .join('\n');

    const result2 = record2
      .map((item) => `itemid: ${item.id}, details: "${item.comparismDetails}"`)
      .join('\n');

    const prompt = `Compare the following records for similarity in meaning, even if the wording is different. 
Return "Match" if they refer to the same context and "Not Match" if they do not.
Note that matching should not be strict.

Format the response as follows: 
Record1 itemid: [item ID] matches Record2 itemid: [item ID]
Record1 itemid: [item ID] matches Record2 itemid: 0 (if there is no match)

Here are the records:
  
  \nRecord1: ${result1}
  \nRecord2: ${result2}`;

    try {
      const result = await this.compare(prompt, '');
      const objArr = this.stringToObectArray(result);
      const recordUpdate = objArr.map((rec) => {
        const updates = [];

        // Conditionally add the first update only if rec.record2 is not 0
        if (rec.secondaryRecord !== '0') {
          updates.push(
            this.reconciliationSourceRepository.findOneAndUpdate(
              { id: rec.primaryRecord },
              { matchId: [rec.secondaryRecord] },
            ),
          );
        }

        // Always add the second update
        updates.push(
          this.reconciliationSourceRepository.findOneAndUpdate(
            { id: rec.secondaryRecord },
            { matchId: [rec.primaryRecord] },
          ),
        );

        // Return a Promise.all for both updates
        return Promise.all(updates);
      });

      // Await all the record update promises
      await Promise.all(recordUpdate);

      console.log(objArr);
      return result;
    } catch (error) {
      throw new Error(`Error comparing records: ${error.message}`);
    }
  }
}
