import Notification from "../models/notification.model.js"

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({to:userId}).populate({
            path: "from",
            select: "username profileImg"
        })
        
        await Notification.updateMany({to:userId}, {read: true})
        res.status(200).json(notifications)

    } catch (error) {
        console.log("error in getNotifications controller", error.message);
        return res.status(500).json({error: "Internal Server error"});
    }
};

export const deleteNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.deleteMany({to: userId})

        res.status(200).json({message: "Notifications deleted successfully"})
    } catch (error) {
        console.log("error in deleteNotifications controller", error.message);
        return res.status(500).json({error: "Internal Server error"});
    }
};

export const deleteOneNotification = async (req, res) => {
    try {
        const userId = req.user._id;
        const notificationId = req.params.id;
        const notification = Notification.findById(notificationId);

        if(!notification){
            return res.status(404).json({error: "Notification not found"})
        }

        if(notification.to.toString() !== userId.toString()){
            return res.select(403).json({error: "you are not authorized to delete this notification"})
        }

        await Notification.findByIdAndDelete(notificationId)

        res.status(200).json({message: "Notification deleted successfully"})
    } catch (error) {
        console.log("error in deleteOneNotification controller", error.message);
        return res.status(500).json({error: "Internal Server error"});
    }
};