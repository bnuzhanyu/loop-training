import cn.loop.training.ReminderRules;import java.time.*;
public class ReminderRulesTest {
 static void check(boolean b){if(!b)throw new AssertionError();}
 public static void main(String[] args){
  check(ReminderRules.scheduled("2026-10-22","第 2 周 · C 轻训练",null,4,0).equals(LocalDate.of(2026,10,31)));
  check(ReminderRules.scheduled("2026-10-22","第 2 周 · B 长组训练",null,5,2).equals(LocalDate.of(2026,11,5)));
  check(ReminderRules.scheduled("2026-10-22","生成",0,5,2).equals(LocalDate.of(2026,10,24)));
  check(ReminderRules.scheduled("2026-10-22","普通",null,2,0).equals(LocalDate.of(2026,10,26)));
  ZoneId zone=ZoneId.of("Asia/Shanghai");ZonedDateTime before=ZonedDateTime.of(2026,10,22,8,0,0,0,zone),late=before.plusHours(2);
  check(Instant.ofEpochMilli(ReminderRules.nextTrigger(before,540,true,false)).atZone(zone).getHour()==9);
  check(ReminderRules.nextTrigger(late,540,true,false)==late.plusSeconds(5).toInstant().toEpochMilli());
  check(Instant.ofEpochMilli(ReminderRules.nextTrigger(late,540,true,true)).atZone(zone).getDayOfMonth()==23);
  check(Instant.ofEpochMilli(ReminderRules.nextTrigger(late,540,false,false)).atZone(zone).getDayOfMonth()==23);
  System.out.println("PASS: native reminder date parity, postponement, local reminder time, late enable catch-up and one-per-day.");
 }
}
