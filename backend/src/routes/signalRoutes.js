const express = require('express');
const authenticate = require('../middleware/authenticate');
const signalController = require('../controllers/signalController');

const router = express.Router();

router.use(authenticate);
router.get('/', signalController.getSignals);
router.put('/', signalController.saveSignals);
router.get('/:id', signalController.getSignal);
router.patch('/:id', signalController.updateSignal);
router.delete('/:id', signalController.deleteSignal);

module.exports = router;
