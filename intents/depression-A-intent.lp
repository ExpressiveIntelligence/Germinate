#const min_entities = 0.
#const max_entities = 4.
#const min_resources = 1.
#const max_resources = 1.
#const min_outcomes = 2.
#const max_outcomes = 10.
#const min_end_outcomes = 0.

% Have a resource, called depression, that can only increase and starts at 0.

label(resource(r(1)),depression,write).

initialize(set_value(resource(r(1)),scalar(0))).

:- not monotonic(resource(r(1)),increase).
allowed(monotonic(resource(r(1)))).
allowed(monotonic(r(1))).