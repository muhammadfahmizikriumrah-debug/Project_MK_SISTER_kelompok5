jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn()
}));

jest.mock('../src/utils/redis', () => ({
  setEx: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1)
}));

jest.mock('../src/models', () => {
  const userMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn()
  };

  return {
    User: userMock,
    sequelize: {
      authenticate: jest.fn(),
      sync: jest.fn()
    },
    Sequelize: {}
  };
});

jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const axios = require('axios');
const redisClient = require('../src/utils/redis');
const { User } = require('../src/models');
const { validationResult } = require('express-validator');
const authController = require('../src/controllers/auth.controller');
const { Op } = require('sequelize');

const createMockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = jest.fn().mockImplementation((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation((payload) => {
    res.jsonData = payload;
    return res;
  });
  return res;
};

const mockValidationResult = (errors = []) => {
  validationResult.mockReturnValue({
    isEmpty: () => errors.length === 0,
    array: () => errors
  });
};

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.USER_SERVICE_URL = 'http://user-service';
  process.env.USER_SERVICE_FALLBACK_URL = '';
});

afterEach(() => {
  jest.clearAllMocks();
  validationResult.mockReset();
});

describe('AuthController', () => {
  describe('register', () => {
    it('creates a new user and returns tokens', async () => {
      mockValidationResult();
      User.findOne.mockResolvedValue(null);
      const createdUser = {
        id: 'user-1',
        email: 'new@example.com',
        username: 'newuser',
        toJSON: () => ({ id: 'user-1', email: 'new@example.com', username: 'newuser' }),
        update: jest.fn().mockResolvedValue()
      };
      User.create.mockResolvedValue(createdUser);
      axios.post.mockResolvedValue({ data: { success: true } });

      const req = {
        body: {
          email: 'new@example.com',
          username: 'newuser',
          password: 'password123'
        }
      };
      const res = createMockRes();
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object)
      }));
      const whereClause = User.findOne.mock.calls[0][0].where;
      const orConditions = whereClause[Op.or];
      expect(orConditions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: 'new@example.com' }),
          expect.objectContaining({ username: 'newuser' })
        ])
      );
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        email: 'new@example.com',
        username: 'newuser'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({ email: 'new@example.com' }),
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        })
      }));
      expect(redisClient.setEx).toHaveBeenCalledWith(
        expect.stringMatching(/^user:/),
        3600,
        expect.any(String)
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when validation fails', async () => {
      mockValidationResult([{ msg: 'Invalid', param: 'email' }]);
      const req = {
        body: {}
      };
      const res = createMockRes();
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid', param: 'email' }] });
      expect(User.create).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('logs in an active user with valid credentials', async () => {
      mockValidationResult();
      const userRecord = {
        id: 'user-1',
        email: 'login@example.com',
        username: 'loginuser',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue(),
        toJSON: () => ({ id: 'user-1', email: 'login@example.com', username: 'loginuser' })
      };
      User.findOne.mockResolvedValue(userRecord);
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: { id: 'user-1', email: 'login@example.com', username: 'loginuser', profileComplete: true }
        }
      });

      const req = {
        body: { email: 'login@example.com', password: 'password123' }
      };
      const res = createMockRes();
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'login@example.com' } });
      expect(userRecord.comparePassword).toHaveBeenCalledWith('password123');
      expect(userRecord.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({ username: 'loginuser' }),
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        })
      }));
      expect(redisClient.setEx).toHaveBeenCalledWith(
        'user:user-1',
        3600,
        expect.stringContaining('login@example.com')
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when password is invalid', async () => {
      mockValidationResult();
      const userRecord = {
        id: 'user-1',
        email: 'login@example.com',
        username: 'loginuser',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      User.findOne.mockResolvedValue(userRecord);

      const req = {
        body: { email: 'login@example.com', password: 'wrong' }
      };
      const res = createMockRes();
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Invalid email or password'
      }));
      expect(userRecord.comparePassword).toHaveBeenCalledWith('wrong');
      expect(next).not.toHaveBeenCalled();
    });
  });
});
