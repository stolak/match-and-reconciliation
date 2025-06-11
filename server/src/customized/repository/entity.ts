import {
  Document,
  FilterQuery,
  Model,
  PipelineStage,
  UpdateQuery,
} from 'mongoose';
import { v4 as uuid } from 'uuid';

export abstract class EntityRepository<T extends Document> {
  constructor(protected readonly entityModel: Model<T>) {}

  async findOne(
    entityFilterQuery: FilterQuery<T>,
    projection?: Record<string, any>,
  ): Promise<T | null> {
    return this.entityModel
      .findOne(entityFilterQuery, {
        _id: 1,
        __v: 0,
        ...projection,
      })
      .exec();
  }

  async find(entityFilterQuery: FilterQuery<T>): Promise<T[] | null> {
    return this.entityModel.find(entityFilterQuery);
  }

  async findWithSort(
    entityFilterQuery: FilterQuery<T>,
    sort: Record<string, any>,
  ): Promise<T[] | null> {
    return this.entityModel.find(entityFilterQuery).sort(sort);
  }

  async create(createEntityData: any): Promise<T> {
    const entity = new this.entityModel(createEntityData);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return entity.save();
  }

  async createWithBase(createEntityData: any): Promise<T> {
    if (!createEntityData?.id) {
      createEntityData = { ...createEntityData, id: uuid() };
    }
    const entity = new this.entityModel(createEntityData);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return entity.save();
  }

  async findOneAndUpdate(
    entityFilterQuery: FilterQuery<T>,
    updateEntityData: UpdateQuery<any>,
  ): Promise<T | null> {
    return this.entityModel.findOneAndUpdate(
      entityFilterQuery,
      updateEntityData,
      {
        new: true,
        returnOriginal: false,
        returnDocument: 'after',
      },
    );
  }

  async findWithSkipAndLimit(
    entityFilterQuery: FilterQuery<T>,
    skip?: number,
    limit?: number,
  ): Promise<T[] | null> {
    return this.entityModel.find(entityFilterQuery).skip(skip).limit(limit);
  }

  async findWithPaginationAndSorting(
    entityFilterQuery: FilterQuery<T>,
    skip?: number,
    limit?: number,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<T[] | null> {
    return this.entityModel
      .find(entityFilterQuery)
      .sort({ createdAt: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit);
  }

  async deleteMany(entityFilterQuery: FilterQuery<T>): Promise<boolean> {
    const deleteResult = await this.entityModel.deleteMany(entityFilterQuery);
    return deleteResult.deletedCount >= 1;
  }

  async deleteOne(entityFilterQuery: FilterQuery<T>): Promise<boolean> {
    const deleteResult = await this.entityModel.deleteOne(entityFilterQuery);
    return deleteResult.deletedCount >= 1;
  }

  /**
   * Let it infer the type of the entity
   * @param entityFilterQuery
   */
  async findOneAndDelete(entityFilterQuery: FilterQuery<T>) {
    return this.entityModel.findOneAndDelete(entityFilterQuery);
  }

  async count(entityFilterQuery: FilterQuery<T>): Promise<number> {
    return this.entityModel.countDocuments(entityFilterQuery);
  }

  async updateMany(
    entityFilterQuery: FilterQuery<T>,
    updateEntityData: UpdateQuery<any>,
  ): Promise<boolean> {
    const updateResult = await this.entityModel.updateMany(
      entityFilterQuery,
      updateEntityData,
      {
        returnOriginal: false,
      },
    );
    return updateResult.acknowledged;
  }

  async aggregate(pipeline: PipelineStage[]): Promise<any> {
    return await this.entityModel.aggregate(pipeline).exec();
  }
}
