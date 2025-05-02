
import express from 'express';
import * as classController from '../../../controllers/class.controller.js';

const router = express.Router();


router.get('/', classController.getAllClasses);
router.get('/stats', classController.getAllClassesWithStats);
router.get('/:id', classController.getSingleClass);
router.get('/:id/stats', classController.getSingleClassWithStats);
router.post('/', classController.createClass);
router.put('/:id', classController.updateClass);
router.delete('/:id', classController.deleteClass);

export default router;
