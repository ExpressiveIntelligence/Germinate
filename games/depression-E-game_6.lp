label(resource(r_1_XX_),depression,write).

resource(r_1_XX_).

initialize(set_value(resource(r_1_XX_),scalar(0))).

boundary(torus).

initialize(set_value(resource(r_1_XX_),scalar(0))).
initialize(set_value(resource(r_1_XX_),scalar(1))).

precondition(ge(resource(r_1_XX_),scalar(10)),outcome(o_1_XX_)).
result(outcome(o_1_XX_),mode_change(game_loss)).

precondition(le(resource(r_1_XX_),scalar(1)),outcome(o_2_XX_)).
result(outcome(o_2_XX_),mode_change(game_win)).

precondition(control_event(button(mouse,pressed)),outcome(o_3_XX_)).
precondition(le(amount(clear),resource(r_1_XX_)),outcome(o_3_XX_)).
result(outcome(o_3_XX_),decrease(resource(r_1_XX_),scalar(4))).

precondition(tick,tick).
result(tick,increase_over_time(resource(r_1_XX_),scalar(1))).
result(tick,increase_over_time(resource(r_1_XX_),scalar(1))).

reading(goal(reduce),resource(r_1_XX_)).
reading(bad,resource(r_1_XX_)).
reading(bad,tick).
reading(good,outcome(o_3_XX_)).
reading(maintenance,resource(r_1_XX_)).
==========
<ul>
<li>depressionE_2.lp</li>
<li>GOAL:<ul>
<li>Reduce depression</li>
</ul></li>

<li>SUBGOALS:<ul>
<li>
	pressing the mouse button
	 at the same time as
having amount(clear) be low
</li>
</ul></li>
<li>CONTROLS:<ul>
</ul></ul>
