import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('sites')
@Controller('sites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SitesController {
    constructor(private sitesService: SitesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new site' })
    async create(@CurrentUser() user: any, @Body() dto: CreateSiteDto) {
        return this.sitesService.create(user.id, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all sites for current user' })
    async findAll(@CurrentUser() user: any) {
        return this.sitesService.findAll(user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific site by ID' })
    async findOne(@CurrentUser() user: any, @Param('id') id: string) {
        return this.sitesService.findOne(user.id, id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a site' })
    async update(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body() dto: UpdateSiteDto,
    ) {
        return this.sitesService.update(user.id, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a site' })
    async delete(@CurrentUser() user: any, @Param('id') id: string) {
        await this.sitesService.delete(user.id, id);
        return { message: 'Site deleted successfully' };
    }
}
