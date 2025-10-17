/**
 * FlowScript IR Validation
 *
 * Validates IR JSON against the canonical schema (spec/ir.schema.json)
 */

import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import { IR } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: any[];
}

/**
 * Validate IR against the canonical schema
 *
 * @param ir - The IR object to validate
 * @returns Validation result with errors if invalid
 */
export function validateIR(ir: IR): ValidationResult {
  // Load schema
  const schemaPath = path.join(__dirname, '../spec/ir.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

  // Create validator
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);

  // Validate
  const valid = validate(ir) as boolean;

  return {
    valid,
    errors: validate.errors || []
  };
}
