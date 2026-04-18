import express from 'express';
import { getAllTechnicians } from '../controllers/supervisorController.js';

const supervisorRoutes = express.Router();

// GET /technicians
supervisorRoutes.get('/', getAllTechnicians);

export default supervisorRoutes;