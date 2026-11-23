const express = require('express');
const router  = express.Router();
const explorerCtrl = require('../controllers/explorerController');
const { optionalAuth } = require('../middleware/auth');

// Dropdown & Metadata Endpoints (Cascading Filters)
router.get('/query-types', optionalAuth, explorerCtrl.getQueryTypes);
router.get('/states', explorerCtrl.getStates);
router.get('/districts', explorerCtrl.getDistricts);
router.get('/constituencies', explorerCtrl.getConstituencies);
router.get('/polling-stations', explorerCtrl.getPollingStations);
router.get('/filter-options', explorerCtrl.getFilterOptions);

// Safe Parameterized Search Execution
router.get('/search', optionalAuth, explorerCtrl.searchRecords);

// Academic DBMS Concept Demonstration (Phase 11 for Faculty Evaluation)
router.get('/demo-concepts', explorerCtrl.getDemoConcepts);
router.post('/execute-concept', optionalAuth, explorerCtrl.executeDemoConcept);

module.exports = router;
