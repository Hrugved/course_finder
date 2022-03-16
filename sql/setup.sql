DROP TABLE IF EXISTS instructor,course,course_instructors; 

CREATE TABLE instructor (
	inst_id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	inst_name varchar(255) NOT NULL UNIQUE,
	inst_email varchar(255) NOT NULL UNIQUE
);

CREATE TABLE course (
	course_id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    course_name varchar(10) NOT NULL UNIQUE,
    course_name_extended varchar(255) NOT NULL,
    branch varchar(10) NOT NULL,
    credits tinyint unsigned NOT NULL,
    credits_extended varchar(20) NOT NULL,
    sched_discussion varchar(100),
    sched_tutorial varchar(100),
    sched_practical varchar(100),
    sched_bitmap BINARY(180) NOT NULL,
    course_type varchar(255) NOT NULL,
    course_type_bitmap BINARY(4) NOT NULL
);

CREATE TABLE course_instructors (
    course_id int,
    inst_id int,
	FOREIGN KEY (course_id) REFERENCES course(course_id),
    FOREIGN KEY (inst_id) REFERENCES instructor(inst_id),
    PRIMARY KEY (course_id,inst_id)
); 