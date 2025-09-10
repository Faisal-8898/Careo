/**
 * Procedure Executes Index
 * Centralized exports for all procedure execution modules
 */

const adminProcedures = require('./adminProcedures');
const stationProcedures = require('./stationProcedures');
const routeProcedures = require('./routeProcedures');

module.exports = {
    adminProcedures,
    stationProcedures,
    routeProcedures
};
