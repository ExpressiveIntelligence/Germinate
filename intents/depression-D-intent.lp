#const min_entities = 0.
#const max_entities = 2. % Limit the number of entity types to <= 2
#const min_resources = 1.
#const max_resources = 1.
#const min_outcomes = 2.
#const max_outcomes = 10.
#const min_end_outcomes = 0.

% Have a resource, called depression, that can only increase and starts at 0.

label(resource(r(1)),depression,write).

initialize(set_value(resource(r(1)),scalar(0))).

% Loosen the requirement of monotonicity
%:- not monotonic(resource(r(1)),increase).
%allowed(monotonic(resource(r(1)))).
%allowed(monotonic(r(1))).

% Doing nothing should make depression increase (i.e., Continuously increase r1). 
% (Otherwise, would get games where doing nothing kept depression the same, 
% but any action taken made it worse.)
% Also, depression is bad, okay? (Not really motivated by malformed games, 
% I just saw it in past intents and thought it made sense to have here.)

result(tick,increase_over_time(resource(r(1)),scalar(1))).

:- not reading(bad,resource(r(1))).

% Allow a player controlled event to decrease depression
%precondition(control_event(_),O), result(O,modify(decrease,resource(r(1)))) : outcome(O).

%:- not action(mode_change(game_loss)).
