package cn.loop.training;
import android.app.*;import android.content.*;import android.os.Build;import android.content.pm.PackageManager;
import org.json.*;import java.time.*;import java.util.*;
public final class DailyReminders {
 static final String ACTION="cn.loop.training.DAILY_REMINDER",CHANNEL="training_schedule";
 static final int ID=903;
 static android.content.SharedPreferences prefs(Context c){return c.getSharedPreferences("loop",Context.MODE_PRIVATE);}
 static void channel(Context c){c.getSystemService(NotificationManager.class).createNotificationChannel(new NotificationChannel(CHANNEL,"训练日程提醒",NotificationManager.IMPORTANCE_DEFAULT));}
 static boolean permitted(Context c){channel(c);NotificationManager n=c.getSystemService(NotificationManager.class);return (Build.VERSION.SDK_INT<33||c.checkSelfPermission("android.permission.POST_NOTIFICATIONS")==PackageManager.PERMISSION_GRANTED)&&n.areNotificationsEnabled()&&n.getNotificationChannel(CHANNEL).getImportance()!=NotificationManager.IMPORTANCE_NONE;}
 static List<JSONObject> eligible(Context c,LocalDate date){
  List<JSONObject> list=new ArrayList<>();try{
   JSONObject data=new JSONObject(prefs(c).getString("data","{}")),settings=data.optJSONObject("settings"),seen=settings==null?null:settings.optJSONObject("planSeen");JSONArray plans=data.optJSONArray("plans");if(plans==null)return list;
   for(int i=0;i<plans.length();i++){JSONObject p=plans.getJSONObject(i);if(p.optBoolean("paused")||(seen!=null&&date.toString().equals(seen.optString(p.optString("id")))))continue;
    String start=p.optString("startDate");if(start.isEmpty())continue;JSONArray days=p.optJSONArray("days");if(days==null)continue;
    for(int j=0;j<days.length();j++){JSONObject d=days.getJSONObject(j);try{if(date.equals(ReminderRules.scheduled(start,d.optString("title"),d.has("offsetDays")?d.optInt("offsetDays"):null,j,d.optInt("shiftDays")))){list.add(p);break;}}catch(Exception ignored){}}
   }
  }catch(Exception e){android.util.Log.w("Loop","Cannot read reminder schedules",e);}return list;
 }
 static PendingIntent alarm(Context c){return PendingIntent.getBroadcast(c,ID,new Intent(c,DailyReminderReceiver.class).setAction(ACTION),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 public static synchronized void schedule(Context c){
  AlarmManager alarms=c.getSystemService(AlarmManager.class);PendingIntent pending=alarm(c);alarms.cancel(pending);
  if(!prefs(c).getBoolean("reminderEnabled",false)||!permitted(c))return;
  ZonedDateTime now=ZonedDateTime.now();List<JSONObject> plans=eligible(c,now.toLocalDate());if(plans.isEmpty())c.getSystemService(NotificationManager.class).cancel(ID);
  boolean sent=now.toLocalDate().toString().equals(prefs(c).getString("reminderLastDate",""));
  long time=ReminderRules.nextTrigger(now,prefs(c).getInt("reminderMinute",540),!plans.isEmpty(),sent);
  alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,time,pending);
 }
 public static synchronized boolean notifyToday(Context c,boolean test){
  if(!permitted(c)||(!test&&!prefs(c).getBoolean("reminderEnabled",false)))return false;
  LocalDate date=LocalDate.now();if(!test&&date.toString().equals(prefs(c).getString("reminderLastDate","")))return false;
  List<JSONObject> plans=eligible(c,date);if(plans.isEmpty()&&!test)return false;
  String title=test?"循练提醒测试":"今天有 "+plans.size()+" 个训练计划",text=plans.isEmpty()?"系统通知已就绪。":plans.get(0).optString("title")+(plans.size()>1?" 等计划，点击查看。":"，点击开始查看。");
  String id=plans.size()==1?plans.get(0).optString("id"):"@plans";
  Intent intent=new Intent(c,MainActivity.class).putExtra("reminderPlanId",id).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
  PendingIntent open=PendingIntent.getActivity(c,ID,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  Notification notification=new Notification.Builder(c,CHANNEL).setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setContentTitle(title).setContentText(text).setStyle(new Notification.BigTextStyle().bigText(text)).setContentIntent(open).setAutoCancel(true).build();
  try{c.getSystemService(NotificationManager.class).notify(ID,notification);if(!test)prefs(c).edit().putString("reminderLastDate",date.toString()).apply();return true;}catch(SecurityException e){return false;}
 }
 public static String settings(Context c){try{return new JSONObject().put("enabled",prefs(c).getBoolean("reminderEnabled",false)).put("minute",prefs(c).getInt("reminderMinute",540)).put("allowed",permitted(c)).toString();}catch(Exception e){return "{}";}}
}
