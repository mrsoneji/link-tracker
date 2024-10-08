import { Test, TestingModule } from '@nestjs/testing';
import { LinksController } from './links.controller';
import { LinksService } from './services/links.service';
import { Link } from './entities/link.entity';
import { NotFoundException } from '@nestjs/common';

describe('LinksController', () => {
  let controller: LinksController;
  let mockLinksService: any; // Mock del servicio

  beforeEach(async () => {
    mockLinksService = {
      create: jest.fn(),
      findOne: jest.fn(),
      incrementRedirectCount: jest.fn(),
      getStats: jest.fn(),
      invalidateLink: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinksController],
      providers: [
        {
          provide: LinksService,
          useValue: mockLinksService,
        },
      ],
    }).compile();

    controller = module.get<LinksController>(LinksController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debería crear un nuevo enlace y devolverlo', async () => {
      const url = 'http://example.com';
      const password = '12345';
      const expiration = new Date().toISOString();
      const expectedLink: Partial<Link> = {
        originalUrl: url,
        code: 'abcde',
        link: 'http://localhost:3000/abcde',
        password,
        expirationDate: new Date(expiration),
        redirectCount: 0,
        isValid: true,
      };

      mockLinksService.create.mockResolvedValue(expectedLink);

      const result = await controller.create(url, password, expiration);
      expect(result).toEqual(expectedLink);
      expect(mockLinksService.create).toHaveBeenCalledWith(
        url,
        password,
        expect.any(Date),
      );
    });
  });

  describe('invalidateLink', () => {
    it('debería invalidar un enlace', async () => {
      const code = 'abcde';
      await controller.invalidateLink(code);
      expect(mockLinksService.invalidateLink).toHaveBeenCalledWith(code);
    });
  });

  describe('getStats', () => {
    it('debería devolver estadísticas del enlace', async () => {
      const code = 'abcde';
      const link: Partial<Link> = {
        originalUrl: 'http://example.com',
        code,
        link: 'http://localhost:3000/abcde',
        password: undefined,
        expirationDate: undefined,
        redirectCount: 10,
        isValid: true,
      };

      mockLinksService.getStats.mockResolvedValue(link);

      const result = await controller.getStats(code);
      expect(result).toEqual(link);
    });

    it('debería lanzar NotFoundException si el enlace no existe', async () => {
      const code = 'invalid_code';

      mockLinksService.getStats.mockRejectedValue(new NotFoundException());

      await expect(controller.getStats(code)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
