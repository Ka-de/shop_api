import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Connection } from 'mongoose';
import { DatabaseService } from '../../../src/database/database.service';
import { AppModule } from '../../../src/app.module';
import { Fixture } from '../../fixture';
import { RedisCacheService } from '../../../src/redis-cache/redis-cache.service';
import { ConfigService } from '@nestjs/config';
import { expect } from 'chai';
import { itemStub } from '../../stubs/item.stubs';
import { AccessRights } from '../../../src/shared/access.right';

describe('Update Item', () => {
  let app: INestApplication;
  let httpServer: any;
  let moduleFixture: TestingModule;
  let dbConnection: Connection;
  let fixture: Fixture;
  let redisCacheService: RedisCacheService;
  let configService: ConfigService;
  let user = null;
  let token: string;
  let item: any;

  before(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        AppModule
      ],
    }).compile();

    app = moduleFixture.createNestApplication();    
    await app.init();

    httpServer = app.getHttpServer();
    dbConnection = moduleFixture.get<DatabaseService>(DatabaseService).getConnection();
    redisCacheService = moduleFixture.get<RedisCacheService>(RedisCacheService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    fixture = new Fixture(dbConnection, redisCacheService, configService, );
  });

  beforeEach(async () => {
    user = await fixture.createUser({ right: AccessRights.ADMIN });
    token = await fixture.login(user);
    item = await fixture.createItem();
  });

  afterEach(async() => {
    await dbConnection.collection('users').deleteMany({});
    await dbConnection.collection('items').deleteMany({});
  });

  after(async () => {
    await dbConnection.dropDatabase();
    await app.close();
    await moduleFixture.close();
  });

  it('should fail when invalid id is sent', async () => {        
    const response = await request(httpServer)
      .patch(`/items/${1}`)
      .set('token', token);
      
    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);      
    expect(response.body).to.deep.include({
      success: false,
      message: '"id" is not a valid uuid'
    });
  });

  it('should fail when item is not found', async () => {   
    const id = item._id.toString().split('').reverse().join('');  
               
    const response = await request(httpServer)
      .patch(`/items/${id}`)
      .set('token', token);

    expect(response.status).to.equal(HttpStatus.NOT_FOUND);      
    expect(response.body).to.deep.include({
      success: false,
      message: 'Item not found'
    });
  });

  it('should fail when the price is not valid', async () => {        
    const response = await request(httpServer)
      .patch(`/items/${item._id}`)
      .set('token', token)
      .set('password', fixture.password)
      .send({ price: 'Ten' })

    expect(response.status).to.equal(HttpStatus.BAD_REQUEST);      
    expect(response.body).to.deep.include({
      success: false,
      message: '"price" must be a number'
    });
  });

  it('should update the item', async () => {        
    const response = await request(httpServer)
      .patch(`/items/${item._id}`)
      .set('token', token)
      .send({ price: 10000 });    

    expect(response.status).to.equal(HttpStatus.OK);      
    expect(response.body.payload).to.deep.include({
      ...itemStub,
      price: 10000
    });
  });
});
