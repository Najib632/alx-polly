export const cookies = jest.fn(() => ({
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(),
  getAll: jest.fn(),
  toString: jest.fn(),
}))

export const headers = jest.fn(() => ({
  get: jest.fn(),
  has: jest.fn(),
  entries: jest.fn(),
  forEach: jest.fn(),
  values: jest.fn(),
  keys: jest.fn(),
}))
