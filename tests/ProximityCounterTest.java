import cn.loop.training.ProximityCounter;
public class ProximityCounterTest {
 static void check(boolean b,String message){if(!b)throw new AssertionError(message);}
 public static void main(String[] args){
  ProximityCounter c=new ProximityCounter();
  check(!c.accept(0,5,0),"covered at startup");
  check(!c.accept(0,5,1000),"holding near");
  check(!c.accept(5,5,1100),"far should arm only");
  check(c.accept(0,5,1400),"first approach");
  check(!c.accept(0,5,2000),"holding near cannot repeat");
  c.accept(5,5,2100);check(!c.accept(0,5,2150),"short far bounce");
  c.accept(5,5,2200);check(c.accept(0,5,2500),"second full cycle");
  c.accept(5,5,2510);check(!c.accept(0,5,2700),"minimum interval");
  c.accept(5,5,2800);check(c.accept(0,5,3100),"recover after debounce");
  c.reset();check(!c.accept(0,5,4000),"reset must require withdrawal");
  c.accept(10,10,4100);check(c.accept(2,10,4400),"continuous distance sensor");
  check(!c.accept(Float.NaN,5,5000)&&!c.accept(-1,5,5000)&&!c.accept(0,0,5000),"invalid values");
  System.out.println("PASS: startup coverage, near hold, far/near cycles, bounce/cooldown, reset, binary and distance sensors.");
 }
}
