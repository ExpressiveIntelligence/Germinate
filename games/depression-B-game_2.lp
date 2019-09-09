label(resource(r_1_XX_),depression,write).
label(entity(e_1_XX_),e(1)).
label(entity(e_2_XX_),e(2)).
label(entity(e_3_XX_),e(3)).

entity(e_1_XX_).
entity(e_2_XX_).
entity(e_3_XX_).

resource(r_1_XX_).

many(entity(e_1_XX_)).
many(entity(e_2_XX_)).
many(entity(e_3_XX_)).

initialize(set_value(resource(r_1_XX_),scalar(0))).
initialize(add(entity(e_1_XX_),scalar(1),location(middle,center))).
initialize(add(entity(e_2_XX_),scalar(1),location(top,left))).
initialize(add(entity(e_2_XX_),scalar(1),location(top,right))).
initialize(add(entity(e_2_XX_),scalar(1),location(bottom,center))).
initialize(add(entity(e_3_XX_),scalar(1),location(top,center))).
initialize(add(entity(e_3_XX_),scalar(1),location(bottom,left))).
initialize(add(entity(e_3_XX_),scalar(1),location(bottom,right))).
initialize(set_sprite(entity(e_1_XX_),triangle)).
initialize(set_sprite(entity(e_2_XX_),triangle)).
initialize(set_color(entity(e_1_XX_),red)).
initialize(set_color(entity(e_2_XX_),blue)).
initialize(set_sprite(entity(e_3_XX_),triangle)).
initialize(set_color(entity(e_3_XX_),green)).
initialize(set_draggable(entity(e_1_XX_),true)).
initialize(set_static(entity(e_3_XX_),true)).

controlLogic(draggable(entity(e_1_XX_))).

timer_logic(timer(behavior_condition_polarity_entity_e_3_XX__XX__X_patrol_X_tick_XX_),scalar(5),loop).

pool(entity(e_2_XX_),location(top,left),ordered,ordered).
pool(entity(e_3_XX_),location(top,center),ordered,ordered).
pool(entity(e_2_XX_),location(top,right),ordered,ordered).
pool(entity(e_1_XX_),location(middle,center),ordered,ordered).
pool(entity(e_3_XX_),location(bottom,left),ordered,ordered).
pool(entity(e_2_XX_),location(bottom,center),ordered,ordered).
pool(entity(e_3_XX_),location(bottom,right),ordered,ordered).

boundary(closed).

initialize(set_value(resource(r_1_XX_),scalar(0))).
initialize(set_value(resource(r_1_XX_),scalar(4))).

precondition(timer_elapsed(behavior_condition_polarity_entity_e_3_XX__XX__X_patrol_X_tick_XX_),outcome(o_1_XX_)).
result(outcome(o_1_XX_),add(entity(e_1_XX_),scalar(1),pool(entity(e_1_XX_)))).

precondition(ge(resource(r_1_XX_),scalar(3)),outcome(o_2_XX_)).
precondition(overlaps(entity(e_1_XX_),entity(e_1_XX_),true),outcome(o_2_XX_)).
result(outcome(o_2_XX_),decrease(property(entity(e_2_XX_),health),scalar(9))).
result(outcome(o_2_XX_),increase(property(entity(e_2_XX_),health),scalar(7))).
result(outcome(o_2_XX_),add(entity(e_2_XX_),scalar(1),pool(entity(e_2_XX_)))).
result(outcome(o_2_XX_),delete(entity(e_1_XX_))).

precondition(ge(resource(r_1_XX_),scalar(8)),outcome(o_3_XX_)).
result(outcome(o_3_XX_),mode_change(game_loss)).

precondition(overlaps(entity(e_2_XX_),entity(e_3_XX_),true),outcome(o_4_XX_)).
result(outcome(o_4_XX_),decrease(property(entity(e_1_XX_),health),scalar(9))).
result(outcome(o_4_XX_),increase(property(entity(e_1_XX_),health),scalar(2))).
result(outcome(o_4_XX_),delete(entity(e_2_XX_))).

precondition(control_event(button(mouse,held)),outcome(repeled_from_cursor_entity_e_2_XX__XX__XX_)).
result(outcome(repeled_from_cursor_entity_e_2_XX__XX__XX_),decrease_over_time(property(entity(e_2_XX_),health),scalar(7))).
result(outcome(repeled_from_cursor_entity_e_2_XX__XX__XX_),increase_over_time(property(entity(e_2_XX_),health),scalar(7))).
result(outcome(repeled_from_cursor_entity_e_2_XX__XX__XX_),increase_over_time(resource(r_1_XX_),scalar(1))).
result(outcome(repeled_from_cursor_entity_e_2_XX__XX__XX_),look_at(entity(e_2_XX_),cursor,nearest)).
result(outcome(repeled_from_cursor_entity_e_2_XX__XX__XX_),moves(entity(e_2_XX_),backward,scalar(7))).

precondition(tick,tick).
result(tick,increase_over_time(resource(r_1_XX_),scalar(1))).
result(tick,apply_restitution(entity(e_1_XX_),entity(e_1_XX_))).
result(tick,apply_restitution(entity(e_2_XX_),entity(e_2_XX_))).

reading(produces,relation(entity(e_1_XX_),property(entity(e_2_XX_),health))).
reading(produces,relation(entity(e_2_XX_),property(entity(e_1_XX_),health))).
reading(produces,relation(entity(e_3_XX_),property(entity(e_1_XX_),health))).
reading(consumes,relation(entity(e_1_XX_),property(entity(e_2_XX_),health))).
reading(consumes,relation(entity(e_2_XX_),property(entity(e_1_XX_),health))).
reading(consumes,relation(entity(e_3_XX_),property(entity(e_1_XX_),health))).
reading(goal(reduce),resource(r_1_XX_)).
reading(bad,resource(r_1_XX_)).
reading(bad,outcome(repeled_from_cursor_entity_e_2_XX__XX__XX_)).
reading(costs,relation(entity(e_2_XX_),property(entity(e_2_XX_),health))).
reading(grinding,resource(r_1_XX_)).
==========
<ul>
<li>depression2_2.lp</li>
<li>GOAL:<ul>
<li>Reduce depression</li>
</ul></li>
<li>CONTROLS:<ul>
<li>	controlling [[blue|triangle]] by making it flee the cursor 
by holding the mouse button
</li>
</ul></ul>
