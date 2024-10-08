import { Injectable, NotFoundException } from '@nestjs/common';
import Datastore from 'nedb-promises';
import { Link } from '../entities/link.entity';

@Injectable()
export class LinksService {
  private db: Datastore<Link>;

  constructor() {
    this.db = Datastore.create({
      filename: 'links.db',
      autoload: true,
    });
  }

  generateMaskedUrl(length: number): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }

  async create(
    originalUrl: string,
    password?: string,
    expirationDate?: Date,
  ): Promise<Link> {
    // Primero, verifica si el link ya existe en la base de datos
    const existingDoc: Link = await this.findOneByOriginalUrl(originalUrl);

    if (existingDoc) {
      // Si el link ya existe, actualízalo con la nueva información
      const updatedLink: Link = {
        ...existingDoc,
        password,
        expirationDate,
      };

      // Usa `await` para actualizar la base de datos sin la necesidad de promesas explícitas
      await this.db.update({ code: updatedLink.code }, updatedLink, {});
      return updatedLink;
    }

    // Si el link no existe, genera un nuevo código enmascarado
    const code = this.generateMaskedUrl(5);
    const link = `http://localhost:3000/${code}`;

    // Crea el nuevo objeto link
    const newLink: Partial<Link> = {
      originalUrl,
      code,
      link,
      password,
      expirationDate,
      redirectCount: 0,
      isValid: true,
    };

    // Inserta el nuevo link en la base de datos usando `await`
    const insertedDoc = await this.db.insert(newLink);
    return insertedDoc;
  }

  async findOne(code: string): Promise<Link> {
    const doc = await this.db.findOne({ code });
    if (!doc || !doc.isValid) {
      throw new NotFoundException('Link not found, invalid or expired');
    }

    // Verificar si la fecha de expiración ya pasó
    const now = new Date();
    if (doc.expirationDate && doc.expirationDate < now) {
      // Actualizar el campo isValid a false si ha expirado
      await this.invalidateLink(code);
      throw new NotFoundException('Link not found, invalid or expired');
    }

    return doc;
  }

  async findOneByOriginalUrl(originalUrl: string): Promise<Link | null> {
    const doc = await this.db.findOne({ originalUrl, isValid: true });

    if (!doc || !doc.isValid) {
      return null;
    }

    return doc;
  }

  async incrementRedirectCount(link: any): Promise<void> {
    link.redirectCount += 1;

    // Usa `await` para actualizar el documento en la base de datos
    await this.db.update({ code: link.code }, link, {});
  }

  async invalidateLink(code: string): Promise<void> {
    // Usa `await` para actualizar el documento en la base de datos
    await this.db.update({ code }, { $set: { isValid: false } }, {});
  }

  async getStats(code: string): Promise<Link> {
    const doc = await this.db.findOne({ code });
    if (!doc) {
      throw new NotFoundException('Link not found, invalid or expired');
    }
    return doc;
  }
}
