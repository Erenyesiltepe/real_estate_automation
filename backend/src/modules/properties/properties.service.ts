import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from './schemas/properties.schema';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreatePropertyDto): Promise<PropertyDocument> {
    await this.usersService.findOne(dto.listingAgentId);
    const created = new this.propertyModel(dto);
    return created.save();
  }

  findAll(): Promise<PropertyDocument[]> {
    return this.propertyModel.find().exec();
  }

  async findOne(id: string): Promise<PropertyDocument> {
    const property = await this.propertyModel.findById(id).exec();
    if (!property) {
      throw new NotFoundException(`Property ${id} not found`);
    }
    return property;
  }

  async update(id: string, dto: UpdatePropertyDto): Promise<PropertyDocument> {
    const property = await this.propertyModel.findById(id).exec();
    if (!property) {
      throw new NotFoundException(`Property ${id} not found`);
    }
    if (dto.listingAgentId) {
      await this.usersService.findOne(dto.listingAgentId);
    }
    Object.assign(property, dto);
    return property.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.propertyModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Property ${id} not found`);
    }
  }
}
