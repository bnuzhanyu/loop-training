package cn.loop.training;
import java.time.*;
import java.util.regex.*;
public final class ReminderRules {
 public static LocalDate scheduled(String start,String title,Integer offset,int index,int shift){
  int days=index*2;Matcher m=Pattern.compile("^第 (\\d+) 周").matcher(title);
  if(offset!=null)days=offset;else if(m.find())days=(Integer.parseInt(m.group(1))-1)*7+(title.contains("C 轻")?2:title.contains("B 长")||title.contains("测试日")?5:0);
  return LocalDate.parse(start).plusDays(days+shift);
 }
 public static long nextTrigger(ZonedDateTime now,int minute,boolean eligible,boolean alreadySent){
  ZonedDateTime at=now.toLocalDate().atTime(minute/60,minute%60).atZone(now.getZone());
  if(!at.isAfter(now)){if(eligible&&!alreadySent)return now.plusSeconds(5).toInstant().toEpochMilli();at=now.toLocalDate().plusDays(1).atTime(minute/60,minute%60).atZone(now.getZone());}
  return at.toInstant().toEpochMilli();
 }
}
