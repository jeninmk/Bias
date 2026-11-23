/**
 * Public surface of the forecasting engine.
 * All scoring is pure functions over observations: no I/O, no network,
 * no database. The dashboard and collectors feed observations in and
 * read scored trends out.
 */
export * from './types';
export * from './synonyms';
export * from './normalize';
export * from './score';
export * from './lifecycle';
export * from './forecast';
