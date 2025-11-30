import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SitesModule } from './modules/sites/sites.module';
import { GscModule } from './modules/integrations/gsc/gsc.module';
import { ContentAuditModule } from './modules/content-audit/content-audit.module';
import { SerpModule } from './modules/integrations/serp/serp.module';
import { AutoOptimizeModule } from './modules/auto-optimize/auto-optimize.module';
import { InternalLinkingModule } from './modules/internal-linking/internal-linking.module';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // Database
        PrismaModule,

        // Feature modules
        AuthModule,
        UsersModule,
        SitesModule,
        GscModule,
        ContentAuditModule,
        SerpModule,
        AutoOptimizeModule,
        InternalLinkingModule,
    ],
    providers: [
        // Global exception filter
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
    ],
})
export class AppModule { }
