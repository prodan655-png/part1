import { Module } from '@nestjs/common';
import { GscOAuthService } from './gsc-oauth.service';
import { GscAuthController } from './gsc-auth.controller';
import { GscService } from './gsc.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [GscAuthController],
    providers: [GscOAuthService, GscService],
    exports: [GscOAuthService, GscService],
})
export class GscModule { }
