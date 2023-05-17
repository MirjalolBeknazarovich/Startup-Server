import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CourseModule } from './course/course.module';

@Module({
  imports: [AuthModule, CourseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
