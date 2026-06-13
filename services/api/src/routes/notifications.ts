import { Router } from 'express'; import { requireAuth } from '../middleware/auth'; import { Notification } from '../models/Notification'; import { asyncHandler } from '../utils/asyncHandler';
export const notificationRouter = Router(); notificationRouter.use(requireAuth);
notificationRouter.get('/', asyncHandler(async(req,res)=>res.json(await Notification.find({userId:req.user!.id}).sort({createdAt:-1}).limit(50))));
notificationRouter.patch('/:id/read', asyncHandler(async(req,res)=>{ const doc=await Notification.findOneAndUpdate({_id:req.params.id,userId:req.user!.id},{readAt:new Date()},{new:true}); if(!doc) return res.status(404).json({message:'Notification not found'}); res.json(doc); }));
