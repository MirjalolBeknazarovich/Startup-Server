import { ConfigService } from '@nestjs/config/dist';
import { MongooseModuleOptions } from '@nestjs/mongoose/dist';

export const getMongoDBConfig = async (
  configService: ConfigService,
): Promise<MongooseModuleOptions> => {
  return {
    uri: configService.get<string>('MONGODB_URI'),
  };
};
