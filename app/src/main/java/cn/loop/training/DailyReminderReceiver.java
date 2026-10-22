package cn.loop.training;
import android.content.*;
public class DailyReminderReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context c,Intent intent){if(DailyReminders.ACTION.equals(intent.getAction()))DailyReminders.notifyToday(c,false);DailyReminders.schedule(c);}
}
