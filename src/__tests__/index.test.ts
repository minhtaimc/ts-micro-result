import { Result, ok, err, ErrorDetail } from '../index';

describe('ts-micro-result', () => {
  describe('ok function', () => {
    it('should create a success result with data', () => {
      const result = ok('test data');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.data).toBe('test data');
      }
    });

    it('should create a success result without data', () => {
      const result = ok();
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.data).toBeUndefined();
      }
    });
  });

  describe('err function', () => {
    it('should create an error result', () => {
      const errorDetail: ErrorDetail = {
        code: 'TEST_ERROR',
        message: 'Test error message'
      };
      
      const result = err(errorDetail);
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toEqual(errorDetail);
      }
    });
  });

  describe('Result type', () => {
    it('should handle success case correctly', () => {
      const result: Result<string> = ok('success');
      
      if (result.ok) {
        expect(result.data).toBe('success');
      } else {
        fail('Should not reach here');
      }
    });

    it('should handle error case correctly', () => {
      const errorDetail: ErrorDetail = {
        code: 'ERROR',
        message: 'Error occurred'
      };
      
      const result: Result<string> = err(errorDetail);
      
      if (!result.ok) {
        expect(result.error).toEqual(errorDetail);
      } else {
        fail('Should not reach here');
      }
    });
  });
}); 