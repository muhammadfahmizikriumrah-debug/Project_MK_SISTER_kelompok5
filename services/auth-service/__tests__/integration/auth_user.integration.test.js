process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'integration-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.TEST_DATABASE_URL = 'sqlite::memory:';
process.env.TEST_DATABASE_STORAGE = undefined;

const USER_SERVICE_PORT = 4100;
process.env.USER_SERVICE_URL = `http://127.0.0.1:${USER_SERVICE_PORT}`;
process.env.USER_SERVICE_FALLBACK_URL = '';

const path = require('path');
const request = require('supertest');

const authApp = require('../../src/index');
const authModels = require('../../src/models');

const userApp = require(path.join(__dirname, '../../../user-service/src/index'));
const userModels = require(path.join(__dirname, '../../../user-service/src/models'));

let userServer;

jest.setTimeout(20000);

beforeAll(async () => {
  await authModels.sequelize.sync({ force: true });
  await userModels.sequelize.sync({ force: true });

  await new Promise((resolve) => {
    userServer = userApp.listen(USER_SERVICE_PORT, resolve);
  });
});

afterEach(async () => {
  await authModels.sequelize.sync({ force: true });
  await userModels.sequelize.sync({ force: true });
});

afterAll(async () => {
  if (userServer) {
    await new Promise((resolve) => userServer.close(resolve));
  }
  await authModels.sequelize.close();
  await userModels.sequelize.close();
});

describe('Auth ↔ User service integration', () => {
  it('registers a user and makes the profile available in user service', async () => {
    const registerPayload = {
      email: 'integration@example.com',
      username: 'integrationUser',
      password: 'securePassword123'
    };

    const registerResponse = await request(authApp)
      .post('/api/auth/register')
      .send(registerPayload)
      .expect(201);

    expect(registerResponse.body).toMatchObject({
      success: true,
      data: {
        user: expect.objectContaining({
          email: registerPayload.email,
          username: registerPayload.username
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String)
      }
    });

    const userId = registerResponse.body.data.user.id;

    const userServiceResponse = await request(userApp)
      .get(`/api/users/${userId}`)
      .expect(200);

    expect(userServiceResponse.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        id: userId,
        email: registerPayload.email,
        username: registerPayload.username
      })
    });

    const loginResponse = await request(authApp)
      .post('/api/auth/login')
      .send({
        email: registerPayload.email,
        password: registerPayload.password
      })
      .expect(200);

    expect(loginResponse.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        user: expect.objectContaining({
          email: registerPayload.email,
          username: registerPayload.username
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String)
      })
    });
  });
});
