import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import * as AWS from 'aws-sdk';

@Injectable()
export class AppService {
  AWS_SW_BUCKET = 'aws-nest-app-store';
  s3 = new AWS.S3({
    accessKeyId: 'AKIATJDURYXKBDWGH7X3',
    secretAccessKey: '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',
  });
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}
  async create(data: any): Promise<User> {
    return this.userRepository.save(data);
  }
  async findOne(condition: any): Promise<User> {
    return this.userRepository.findOne(condition);
  }
  async uploadFile(file) {
    console.log(file);
    const { originalname } = file;
    return await this.s3_upload(
      file.buffer,
      this.AWS_SW_BUCKET,
      originalname,
      file.mimetype,
    );
  }

  async s3_upload(file, bucket, name, mimetype) {
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
      ACL: 'public-read',
      ContentType: mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: 'ap-south-1',
      },
    };
    try {
      const s3response = await this.s3.upload(params).promise();
      return s3response;
    } catch (e) {
      console.log(e);
    }
  }
}
