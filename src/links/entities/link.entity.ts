import { ApiProperty } from '@nestjs/swagger';

export class Link {
  @ApiProperty({ description: 'El ID del link' })
  id: string;

  @ApiProperty({ description: 'La URL original' })
  originalUrl: string;

  @ApiProperty({ description: 'El link enmascarado' })
  link: string;

  @ApiProperty({ description: 'El código generado automáticamente' })
  code: string;

  @ApiProperty({ description: 'Contraseña asociada al link', required: false })
  password?: string;

  @ApiProperty({ description: 'Fecha de expiración', required: false })
  expirationDate?: Date;

  @ApiProperty({
    description:
      'Estadistica de cantidad de veces que la redirección fue invocada.',
    required: false,
  })
  redirectCount: number;

  @ApiProperty({
    description: 'Determina si la url es válida',
    required: false,
  })
  isValid?: boolean;
}
