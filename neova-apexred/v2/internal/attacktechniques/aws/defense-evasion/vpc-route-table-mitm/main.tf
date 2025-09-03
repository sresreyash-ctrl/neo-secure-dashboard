terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.54.0, < 5.0.0"
    }
  }
}

provider "aws" {}

resource "random_string" "suffix" {
  length  = 8
  special = false
}

resource "aws_vpc" "mitm_vpc" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "mitm_subnet" {
  vpc_id     = aws_vpc.mitm_vpc.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_instance" "victim" {
  ami           = "ami-0c02fb55956c7d316" # Amazon Linux 2, update as needed
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.mitm_subnet.id
}

resource "aws_instance" "attacker" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.mitm_subnet.id
}

resource "aws_route_table" "mitm_rt" {
  vpc_id = aws_vpc.mitm_vpc.id
}

resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.mitm_subnet.id
  route_table_id = aws_route_table.mitm_rt.id
}

resource "aws_route" "malicious_route" {
  route_table_id         = aws_route_table.mitm_rt.id
  destination_cidr_block = "0.0.0.0/0"
  network_interface_id   = aws_instance.attacker.primary_network_interface_id
}

output "victim_instance_id" {
  value = aws_instance.victim.id
}

output "attacker_instance_id" {
  value = aws_instance.attacker.id
}

output "route_table_id" {
  value = aws_route_table.mitm_rt.id
} 