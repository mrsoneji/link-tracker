import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Query,
  Res,
  Body,
} from '@nestjs/common';
import { Response } from 'express';
import { LinksService } from './services/links.service';
import { Link } from './entities/link.entity';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('links')
@Controller('')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post('/create')
  @ApiOperation({ summary: 'Crear un nuevo link enmascarado' })
  @ApiBody({
    description: 'Datos necesarios para crear el link',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL original a enmascarar' },
        password: {
          type: 'string',
          description: 'Contraseña para proteger el link',
        },
        expiration: {
          type: 'string',
          format: 'date-time',
          description: 'Fecha de expiración',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Link creado con éxito' })
  async create(
    @Body('url') url: string,
    @Body('password') password?: string,
    @Body('expiration') expiration?: string,
  ): Promise<Link> {
    const expirationDate = expiration ? new Date(expiration) : undefined;
    return this.linksService.create(url, password, expirationDate);
  }

  @Get(':code')
  @ApiOperation({
    summary: 'Redirigir a la URL original a partir del code',
  })
  @ApiParam({
    name: 'code',
    description:
      'El URL enmascarado generado para redireccionar a la URL original',
    example: 'aBsJu',
  })
  @ApiQuery({
    name: 'password',
    description: 'Contraseña opcional para acceder al link redirigido',
    required: false,
    example: '12345',
  })
  async redirect(
    @Res() res: Response,
    @Param('code') code: string,
    @Query('password') password?: string,
  ) {
    const link = await this.linksService.findOne(code);

    if (link.password && link.password !== password) {
      return res.status(403).send('Forbidden');
    }

    await this.linksService.incrementRedirectCount(link);
    return res.redirect(link.originalUrl);
  }

  @Get(':code/stats')
  @ApiOperation({
    summary: 'Obtener estadísticas de redirecciones para un link',
  })
  @ApiParam({ name: 'code', description: 'Identificador del link enmascarado' })
  @ApiResponse({ status: 200, description: 'Estadísticas del link' })
  async getStats(@Param('code') code: string) {
    return this.linksService.getStats(code);
  }

  @Put(':code/invalidate')
  @ApiOperation({ summary: 'Invalidar un link enmascarado' })
  @ApiParam({ name: 'code', description: 'Identificador del link enmascarado' })
  @ApiResponse({ status: 200, description: 'Link invalidado con éxito' })
  async invalidateLink(@Param('code') code: string) {
    await this.linksService.invalidateLink(code);
  }
}
