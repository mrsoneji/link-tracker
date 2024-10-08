import { Test, TestingModule } from '@nestjs/testing';
import { LinksService } from './links.service';
import Datastore from 'nedb-promises';
import { NotFoundException } from '@nestjs/common';
import { Link } from '../entities/link.entity';

jest.mock('nedb-promises');

describe('LinksService', () => {
  let service: LinksService;
  let mockDb: any; // Mock de la base de datos

  beforeEach(async () => {
    mockDb = {
      insert: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
    };

    (Datastore.create as jest.Mock).mockReturnValue(mockDb);

    const module: TestingModule = await Test.createTestingModule({
      providers: [LinksService],
    }).compile();

    service = module.get<LinksService>(LinksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('generateMaskedUrl', () => {
    it('debería generar una cadena de la longitud especificada', () => {
      const resultado = service.generateMaskedUrl(5);
      expect(resultado).toHaveLength(5);
    });
  });

  describe('create', () => {
    it('debería crear un nuevo enlace', async () => {
      const originalUrl = 'http://example.com';
      const newLink: Partial<Link> = {
        originalUrl,
        code: 'abcde',
        link: 'http://localhost:3000/abcde',
        password: undefined,
        expirationDate: undefined,
        redirectCount: 0,
        isValid: true,
      };

      (mockDb.findOne as jest.Mock).mockResolvedValue(null);
      (mockDb.insert as jest.Mock).mockResolvedValue(newLink);

      const resultado = await service.create(originalUrl);
      expect(resultado).toEqual(newLink);
      expect(mockDb.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          originalUrl,
        }),
      );
    });

    it('debería actualizar un enlace existente', async () => {
      const originalUrl = 'http://example.com';
      const existingLink: Partial<Link> = {
        originalUrl,
        code: 'abcde',
        link: 'http://localhost:3000/abcde',
        password: undefined,
        expirationDate: undefined,
        redirectCount: 0,
        isValid: true,
      };

      (mockDb.findOne as jest.Mock).mockResolvedValue(existingLink);
      (mockDb.update as jest.Mock).mockResolvedValue(existingLink);

      const resultado = await service.create(originalUrl);
      expect(resultado).toEqual(existingLink);
    });
  });

  describe('findOne', () => {
    it('debería devolver un enlace válido', async () => {
      const code = 'abcde';
      const link: Partial<Link> = {
        originalUrl: 'http://example.com',
        code,
        link: 'http://localhost:3000/abcde',
        password: undefined,
        expirationDate: undefined,
        redirectCount: 0,
        isValid: true,
      };

      (mockDb.findOne as jest.Mock).mockResolvedValue(link);

      const resultado = await service.findOne(code);
      expect(resultado).toEqual(link);
    });

    it('debería lanzar NotFoundException si el enlace es inválido', async () => {
      const code = 'invalid_code';
      (mockDb.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(code)).rejects.toThrow(NotFoundException);
    });

    it('debería invalidar el enlace si ha expirado', async () => {
      const code = 'abcde';
      const now = new Date();
      const expiredLink: Partial<Link> = {
        originalUrl: 'http://example.com',
        code,
        link: 'http://localhost:3000/abcde',
        password: undefined,
        expirationDate: new Date(now.getTime() - 1000), // Expirado
        redirectCount: 0,
        isValid: true,
      };

      (mockDb.findOne as jest.Mock).mockResolvedValue(expiredLink);
      (mockDb.update as jest.Mock).mockResolvedValue(undefined);

      await expect(service.findOne(code)).rejects.toThrow(NotFoundException);
      expect(mockDb.update).toHaveBeenCalledWith(
        { code },
        { $set: { isValid: false } },
        {},
      );
    });
  });

  describe('findOneByOriginalUrl', () => {
    it('debería devolver el enlace si es válido', async () => {
      const originalUrl = 'http://example.com';
      const link: Partial<Link> = {
        originalUrl,
        code: 'abcde',
        link: 'http://localhost:3000/abcde',
        password: undefined,
        expirationDate: undefined,
        redirectCount: 0,
        isValid: true,
      };

      (mockDb.findOne as jest.Mock).mockResolvedValue(link);

      const resultado = await service.findOneByOriginalUrl(originalUrl);
      expect(resultado).toEqual(link);
    });

    it('debería devolver null si el enlace es inválido', async () => {
      const originalUrl = 'http://example.com';
      (mockDb.findOne as jest.Mock).mockResolvedValue(null);

      const resultado = await service.findOneByOriginalUrl(originalUrl);
      expect(resultado).toBeNull();
    });
  });

  describe('incrementRedirectCount', () => {
    it('debería incrementar el contador de redirecciones y actualizar el enlace', async () => {
      const link = {
        code: 'abcde',
        redirectCount: 0,
      };

      await service.incrementRedirectCount(link);
      expect(link.redirectCount).toBe(1);
      expect(mockDb.update).toHaveBeenCalledWith({ code: link.code }, link, {});
    });
  });

  describe('invalidateLink', () => {
    it('debería invalidar un enlace', async () => {
      const code = 'abcde';
      await service.invalidateLink(code);
      expect(mockDb.update).toHaveBeenCalledWith(
        { code },
        { $set: { isValid: false } },
        {},
      );
    });
  });

  describe('getStats', () => {
    it('debería devolver las estadísticas del enlace', async () => {
      const code = 'abcde';
      const link: Partial<Link> = {
        originalUrl: 'http://example.com',
        code,
        link: 'http://localhost:3000/abcde',
        password: undefined,
        expirationDate: undefined,
        redirectCount: 0,
        isValid: true,
      };

      (mockDb.findOne as jest.Mock).mockResolvedValue(link);

      const resultado = await service.getStats(code);
      expect(resultado).toEqual(link);
    });

    it('debería lanzar NotFoundException si el enlace no se encuentra', async () => {
      const code = 'invalid_code';
      (mockDb.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getStats(code)).rejects.toThrow(NotFoundException);
    });
  });
});
